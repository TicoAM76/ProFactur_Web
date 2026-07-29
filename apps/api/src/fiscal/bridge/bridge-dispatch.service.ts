import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  FiscalEnvironment,
  FiscalSubmissionState,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createBridgeDispatchToken,
  hashBridgeDispatchToken,
} from './bridge-dispatch-token';

const MAX_TRANSACTION_ATTEMPTS = 3;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export interface CreatedBridgeDispatch {
  dispatchToken: string;
  submissionId: string;
  requestHash: string;
  expiresAt: Date;
}

export interface ClaimedBridgeDispatch {
  companyId: string;
  submissionId: string;
  requestHash: string;
  requestXml: string;
  endpoint: string;
  environment: FiscalEnvironment;
  installationNumber: string;
  claimedAt: Date;
}

@Injectable()
export class BridgeDispatchService {
  constructor(private readonly prisma: PrismaService) {}

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException(
      'El token de despacho no es válido, ha caducado o ya fue utilizado.',
    );
  }

  private async executeCreateDispatch(
    companyId: string,
    submissionId: string,
    now: Date,
  ): Promise<CreatedBridgeDispatch> {
    const generatedToken = createBridgeDispatchToken(now);

    return this.prisma.$transaction(
      async (transaction) => {
        const submission = await transaction.fiscalSubmission.findFirst({
          where: {
            id: submissionId,
            companyId,
          },
          select: {
            id: true,
            state: true,
            requestHash: true,
          },
        });

        if (!submission) {
          throw new NotFoundException('El envío fiscal solicitado no existe.');
        }

        if (submission.state !== FiscalSubmissionState.CREATED) {
          throw new BadRequestException(
            'Solo se puede autorizar un envío fiscal en estado CREATED.',
          );
        }

        const existing = await transaction.fiscalBridgeDispatch.findUnique({
          where: {
            submissionId,
          },
        });

        if (
          existing &&
          existing.claimedAt === null &&
          existing.expiresAt.getTime() > now.getTime()
        ) {
          throw new ConflictException(
            'Ya existe una autorización de Bridge activa para este envío.',
          );
        }

        if (existing?.claimedAt) {
          throw new ConflictException(
            'La autorización de Bridge de este envío ya fue utilizada.',
          );
        }

        if (existing) {
          await transaction.fiscalBridgeDispatch.update({
            where: {
              id: existing.id,
            },
            data: {
              tokenHash: generatedToken.tokenHash,
              requestHash: submission.requestHash,
              expiresAt: generatedToken.expiresAt,
              claimedAt: null,
            },
          });
        } else {
          await transaction.fiscalBridgeDispatch.create({
            data: {
              companyId,
              submissionId,
              tokenHash: generatedToken.tokenHash,
              requestHash: submission.requestHash,
              expiresAt: generatedToken.expiresAt,
            },
          });
        }

        return {
          dispatchToken: generatedToken.token,
          submissionId,
          requestHash: submission.requestHash,
          expiresAt: generatedToken.expiresAt,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async createDispatch(
    companyId: string,
    submissionId: string,
  ): Promise<CreatedBridgeDispatch> {
    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.executeCreateDispatch(
          companyId,
          submissionId,
          new Date(),
        );
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2034' || error.code === 'P2002') &&
          attempt < MAX_TRANSACTION_ATTEMPTS
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new ConflictException(
      'No fue posible reservar una autorización para RN Bridge.',
    );
  }

  private async executeClaimDispatch(
    tokenHash: string,
    now: Date,
  ): Promise<ClaimedBridgeDispatch> {
    return this.prisma.$transaction(
      async (transaction) => {
        const dispatch = await transaction.fiscalBridgeDispatch.findUnique({
          where: {
            tokenHash,
          },
          include: {
            submission: {
              select: {
                id: true,
                companyId: true,
                state: true,
                requestHash: true,
                requestXml: true,
                endpoint: true,
                environment: true,
                installationNumber: true,
              },
            },
          },
        });

        if (
          !dispatch ||
          dispatch.claimedAt !== null ||
          dispatch.expiresAt.getTime() <= now.getTime()
        ) {
          throw this.invalidToken();
        }

        const submission = dispatch.submission;

        if (
          submission.state !== FiscalSubmissionState.CREATED ||
          dispatch.companyId !== submission.companyId ||
          dispatch.requestHash !== submission.requestHash
        ) {
          throw this.invalidToken();
        }

        const claimedDispatch =
          await transaction.fiscalBridgeDispatch.updateMany({
            where: {
              id: dispatch.id,
              tokenHash,
              requestHash: submission.requestHash,
              claimedAt: null,
              expiresAt: {
                gt: now,
              },
            },
            data: {
              claimedAt: now,
            },
          });

        if (claimedDispatch.count !== 1) {
          throw this.invalidToken();
        }

        const reservedSubmission =
          await transaction.fiscalSubmission.updateMany({
            where: {
              id: submission.id,
              companyId: submission.companyId,
              requestHash: submission.requestHash,
              state: FiscalSubmissionState.CREATED,
            },
            data: {
              state: FiscalSubmissionState.SENDING,
              startedAt: now,
            },
          });

        if (reservedSubmission.count !== 1) {
          throw this.invalidToken();
        }

        return {
          companyId: submission.companyId,
          submissionId: submission.id,
          requestHash: submission.requestHash,
          requestXml: submission.requestXml,
          endpoint: submission.endpoint,
          environment: submission.environment,
          installationNumber: submission.installationNumber,
          claimedAt: now,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async claimDispatch(token: string): Promise<ClaimedBridgeDispatch> {
    const normalizedToken = token.trim();

    if (!TOKEN_PATTERN.test(normalizedToken)) {
      throw this.invalidToken();
    }

    const tokenHash = hashBridgeDispatchToken(normalizedToken);

    for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      try {
        return await this.executeClaimDispatch(tokenHash, new Date());
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < MAX_TRANSACTION_ATTEMPTS
        ) {
          continue;
        }

        throw error;
      }
    }

    throw this.invalidToken();
  }
}
