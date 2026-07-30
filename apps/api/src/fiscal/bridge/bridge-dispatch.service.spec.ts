import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  FiscalEnvironment,
  FiscalSubmissionState,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  createBridgeDispatchToken,
  hashBridgeDispatchToken,
} from './bridge-dispatch-token';
import { BridgeDispatchService } from './bridge-dispatch.service';

type SubmissionLookup = {
  id: string;
  companyId: string;
  state: FiscalSubmissionState;
  requestHash: string;
};

type SubmissionForClaim = SubmissionLookup & {
  requestXml: string;
  endpoint: string;
  environment: FiscalEnvironment;
  installationNumber: string;
};

type DispatchLookup = {
  id: string;
  companyId: string;
  submissionId: string;
  tokenHash: string;
  requestHash: string;
  expiresAt: Date;
  claimedAt: Date | null;
  submission?: SubmissionForClaim;
};

type TransactionStub = {
  fiscalSubmission: {
    findFirst: (args: unknown) => Promise<SubmissionLookup | null>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
  fiscalBridgeDispatch: {
    findUnique: (args: unknown) => Promise<DispatchLookup | null>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    updateMany: (args: unknown) => Promise<{ count: number }>;
  };
};

describe('BridgeDispatchService', () => {
  const now = new Date('2026-07-29T20:00:00.000Z');

  const companyId = '10000000-0000-4000-8000-000000000001';
  const submissionId = '20000000-0000-4000-8000-000000000002';
  const dispatchId = '30000000-0000-4000-8000-000000000003';

  const requestHash =
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

  const requestXml =
    '<?xml version="1.0" encoding="UTF-8"?><Envelope>TEST</Envelope>';

  let submissionLookupResult: SubmissionLookup | null;
  let dispatchLookupResult: DispatchLookup | null;

  let dispatchUpdateCount: number;
  let submissionUpdateCount: number;
  let transactionCalls: number;

  let lastDispatchCreateArgs: unknown;
  let lastDispatchUpdateArgs: unknown;
  let lastDispatchClaimArgs: unknown;
  let lastSubmissionUpdateArgs: unknown;

  const transaction: TransactionStub = {
    fiscalSubmission: {
      findFirst: () => Promise.resolve(submissionLookupResult),
      updateMany: (args: unknown) => {
        lastSubmissionUpdateArgs = args;

        return Promise.resolve({
          count: submissionUpdateCount,
        });
      },
    },
    fiscalBridgeDispatch: {
      findUnique: () => Promise.resolve(dispatchLookupResult),
      create: (args: unknown) => {
        lastDispatchCreateArgs = args;

        return Promise.resolve({});
      },
      update: (args: unknown) => {
        lastDispatchUpdateArgs = args;

        return Promise.resolve({});
      },
      updateMany: (args: unknown) => {
        lastDispatchClaimArgs = args;

        return Promise.resolve({
          count: dispatchUpdateCount,
        });
      },
    },
  };

  const prisma = {
    $transaction: <T>(
      callback: (transactionClient: TransactionStub) => Promise<T>,
    ): Promise<T> => {
      transactionCalls += 1;

      return callback(transaction);
    },
  } as unknown as PrismaService;

  let service: BridgeDispatchService;

  function createClaimableDispatch(
    overrides: Partial<DispatchLookup> = {},
    submissionOverrides: Partial<SubmissionForClaim> = {},
  ): {
    token: string;
    dispatch: DispatchLookup;
  } {
    const generated = createBridgeDispatchToken(now);

    const submission: SubmissionForClaim = {
      id: submissionId,
      companyId,
      state: FiscalSubmissionState.CREATED,
      requestHash,
      requestXml,
      endpoint:
        'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
      environment: FiscalEnvironment.TEST,
      installationNumber: 'RNBRIDGE-DEV-1',
      ...submissionOverrides,
    };

    return {
      token: generated.token,
      dispatch: {
        id: dispatchId,
        companyId,
        submissionId,
        tokenHash: generated.tokenHash,
        requestHash,
        expiresAt: new Date(now.getTime() + 300_000),
        claimedAt: null,
        submission,
        ...overrides,
      },
    };
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);

    submissionLookupResult = {
      id: submissionId,
      companyId,
      state: FiscalSubmissionState.CREATED,
      requestHash,
    };

    dispatchLookupResult = null;

    dispatchUpdateCount = 1;
    submissionUpdateCount = 1;
    transactionCalls = 0;

    lastDispatchCreateArgs = undefined;
    lastDispatchUpdateArgs = undefined;
    lastDispatchClaimArgs = undefined;
    lastSubmissionUpdateArgs = undefined;

    service = new BridgeDispatchService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('crea una autorización y almacena únicamente el hash del token', async () => {
    const result = await service.createDispatch(companyId, submissionId);

    expect(result.dispatchToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.submissionId).toBe(submissionId);
    expect(result.requestHash).toBe(requestHash);
    expect(result.expiresAt.toISOString()).toBe('2026-07-29T20:05:00.000Z');

    expect(lastDispatchCreateArgs).toEqual({
      data: {
        companyId,
        submissionId,
        tokenHash: hashBridgeDispatchToken(result.dispatchToken),
        requestHash,
        expiresAt: result.expiresAt,
      },
    });

    expect(lastDispatchCreateArgs).not.toHaveProperty('data.token');
    expect(lastDispatchCreateArgs).not.toHaveProperty('data.dispatchToken');
  });

  it('rechaza un envío que no existe para la empresa', async () => {
    submissionLookupResult = null;

    await expect(
      service.createDispatch(companyId, submissionId),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(lastDispatchCreateArgs).toBeUndefined();
  });

  it('rechaza un envío que no esté en CREATED', async () => {
    submissionLookupResult = {
      id: submissionId,
      companyId,
      state: FiscalSubmissionState.SENDING,
      requestHash,
    };

    await expect(
      service.createDispatch(companyId, submissionId),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(lastDispatchCreateArgs).toBeUndefined();
  });

  it('rechaza crear otro token mientras exista uno activo', async () => {
    dispatchLookupResult = {
      id: dispatchId,
      companyId,
      submissionId,
      tokenHash: 'B'.repeat(64),
      requestHash,
      expiresAt: new Date(now.getTime() + 60_000),
      claimedAt: null,
    };

    await expect(
      service.createDispatch(companyId, submissionId),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(lastDispatchCreateArgs).toBeUndefined();
    expect(lastDispatchUpdateArgs).toBeUndefined();
  });

  it('rota una autorización caducada sin crear otra fila', async () => {
    dispatchLookupResult = {
      id: dispatchId,
      companyId,
      submissionId,
      tokenHash: 'B'.repeat(64),
      requestHash,
      expiresAt: new Date(now.getTime() - 1),
      claimedAt: null,
    };

    const result = await service.createDispatch(companyId, submissionId);

    expect(lastDispatchCreateArgs).toBeUndefined();

    expect(lastDispatchUpdateArgs).toEqual({
      where: {
        id: dispatchId,
      },
      data: {
        tokenHash: hashBridgeDispatchToken(result.dispatchToken),
        requestHash,
        expiresAt: result.expiresAt,
        claimedAt: null,
        executionTokenHash: null,
        executionExpiresAt: null,
        completedAt: null,
      },
    });
  });

  it('rechaza reutilizar una autorización ya reclamada', async () => {
    dispatchLookupResult = {
      id: dispatchId,
      companyId,
      submissionId,
      tokenHash: 'B'.repeat(64),
      requestHash,
      expiresAt: new Date(now.getTime() + 60_000),
      claimedAt: new Date(now.getTime() - 1000),
    };

    await expect(
      service.createDispatch(companyId, submissionId),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reclama el token y cambia el envío de CREATED a SENDING', async () => {
    const claimable = createClaimableDispatch();

    dispatchLookupResult = claimable.dispatch;

    const result = await service.claimDispatch(claimable.token);

    expect(result.companyId).toBe(companyId);
    expect(result.submissionId).toBe(submissionId);
    expect(result.requestHash).toBe(requestHash);
    expect(result.requestXml).toBe(requestXml);
    expect(result.endpoint).toBe(
      'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
    );
    expect(result.environment).toBe(FiscalEnvironment.TEST);
    expect(result.installationNumber).toBe('RNBRIDGE-DEV-1');
    expect(result.claimedAt).toEqual(now);
    expect(result.executionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.executionExpiresAt.toISOString()).toBe(
      '2026-07-29T20:10:00.000Z',
    );

    expect(lastDispatchClaimArgs).toEqual({
      where: {
        id: dispatchId,
        tokenHash: hashBridgeDispatchToken(claimable.token),
        requestHash,
        claimedAt: null,
        executionTokenHash: null,
        completedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      data: {
        claimedAt: now,
        executionTokenHash: hashBridgeDispatchToken(result.executionToken),
        executionExpiresAt: result.executionExpiresAt,
        completedAt: null,
      },
    });

    expect(lastDispatchClaimArgs).not.toHaveProperty('data.executionToken');

    expect(lastSubmissionUpdateArgs).toEqual({
      where: {
        id: submissionId,
        companyId,
        requestHash,
        state: FiscalSubmissionState.CREATED,
      },
      data: {
        state: FiscalSubmissionState.SENDING,
        startedAt: now,
      },
    });
  });

  it('rechaza tokens con formato inválido sin consultar la base', async () => {
    await expect(
      service.claimDispatch('token-invalido'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(transactionCalls).toBe(0);
  });

  it('rechaza un token caducado', async () => {
    const claimable = createClaimableDispatch({
      expiresAt: now,
    });

    dispatchLookupResult = claimable.dispatch;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(lastDispatchClaimArgs).toBeUndefined();
    expect(lastSubmissionUpdateArgs).toBeUndefined();
  });

  it('rechaza un token ya utilizado', async () => {
    const claimable = createClaimableDispatch({
      claimedAt: new Date(now.getTime() - 1000),
    });

    dispatchLookupResult = claimable.dispatch;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza una alteración del requestHash', async () => {
    const claimable = createClaimableDispatch(
      {
        requestHash: 'B'.repeat(64),
      },
      {
        requestHash,
      },
    );

    dispatchLookupResult = claimable.dispatch;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(lastDispatchClaimArgs).toBeUndefined();
  });

  it('rechaza reclamar si el envío ya no está en CREATED', async () => {
    const claimable = createClaimableDispatch(
      {},
      {
        state: FiscalSubmissionState.SENDING,
      },
    );

    dispatchLookupResult = claimable.dispatch;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza la reclamación si otro proceso consumió el token', async () => {
    const claimable = createClaimableDispatch();

    dispatchLookupResult = claimable.dispatch;
    dispatchUpdateCount = 0;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(lastSubmissionUpdateArgs).toBeUndefined();
  });

  it('rechaza la reclamación si no puede reservar el envío', async () => {
    const claimable = createClaimableDispatch();

    dispatchLookupResult = claimable.dispatch;
    submissionUpdateCount = 0;

    await expect(service.claimDispatch(claimable.token)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
