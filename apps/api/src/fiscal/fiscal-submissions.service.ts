import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FiscalRecordState,
  FiscalSubmissionState,
  Prisma,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalXmlService } from './fiscal-xml.service';
import {
  calculateSubmissionRequestHash,
  resolveVerifactuSoapEndpoint,
} from './verifactu-submission-request';

@Injectable()
export class FiscalSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fiscalXmlService: FiscalXmlService,
  ) {}

  private async executePreparation(companyId: string, recordId: string) {
    const generatedXml = await this.fiscalXmlService.generateAltaXml(
      companyId,
      recordId,
    );

    const requestHash = calculateSubmissionRequestHash(generatedXml.xml);

    return this.prisma.$transaction(
      async (transaction) => {
        const record = await transaction.fiscalRecord.findFirst({
          where: {
            id: recordId,
            companyId,
          },
          include: {
            chain: true,
          },
        });

        if (!record) {
          throw new NotFoundException(
            'El registro fiscal solicitado no existe.',
          );
        }

        if (record.state !== FiscalRecordState.PENDING_SUBMISSION) {
          throw new BadRequestException(
            'Solo se pueden preparar registros fiscales en estado PENDING_SUBMISSION.',
          );
        }

        const activeAttempt = await transaction.fiscalSubmissionItem.findFirst({
          where: {
            fiscalRecordId: record.id,
            submission: {
              state: {
                in: [
                  FiscalSubmissionState.CREATED,
                  FiscalSubmissionState.SENDING,
                  FiscalSubmissionState.RESPONSE_RECEIVED,
                ],
              },
            },
          },
          include: {
            submission: {
              select: {
                id: true,
                state: true,
              },
            },
          },
        });

        if (activeAttempt) {
          throw new ConflictException(
            `Ya existe un envío fiscal activo (${activeAttempt.submission.state}) para este registro.`,
          );
        }

        const attempts = await transaction.fiscalSubmissionItem.aggregate({
          where: {
            fiscalRecordId: record.id,
          },
          _max: {
            attemptNumber: true,
          },
        });

        const attemptNumber = (attempts._max.attemptNumber ?? 0) + 1;

        const endpoint = resolveVerifactuSoapEndpoint(
          record.chain.environment,
          process.env.VERIFACTU_SOAP_ENDPOINT,
        );

        return transaction.fiscalSubmission.create({
          data: {
            companyId,
            chainId: record.chainId,
            environment: record.chain.environment,
            installationNumber: record.chain.installationNumber,
            state: FiscalSubmissionState.CREATED,

            endpoint,
            requestXml: generatedXml.xml,
            requestHash,

            items: {
              create: {
                fiscalRecordId: record.id,
                position: 1,
                attemptNumber,
                operation: record.kind,
              },
            },
          },
          include: {
            items: true,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async prepare(companyId: string, recordId: string) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.executePreparation(companyId, recordId);
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < 3
        ) {
          continue;
        }

        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException(
            'Ya existe un intento de envío fiscal equivalente.',
          );
        }

        throw error;
      }
    }

    throw new ConflictException(
      'No fue posible reservar el intento de envío fiscal.',
    );
  }
}
