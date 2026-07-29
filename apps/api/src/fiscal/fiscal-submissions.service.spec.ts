import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  FiscalEnvironment,
  FiscalRecordKind,
  FiscalRecordState,
  FiscalSubmissionState,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { FiscalSubmissionsService } from './fiscal-submissions.service';
import { FiscalXmlService } from './fiscal-xml.service';
import { calculateSubmissionRequestHash } from './verifactu-submission-request';

type SubmissionItemCreateData = {
  fiscalRecordId: string;
  position: number;
  attemptNumber: number;
  operation: FiscalRecordKind;
};

type SubmissionCreateInput = {
  data: {
    companyId: string;
    chainId: string;
    environment: FiscalEnvironment;
    installationNumber: string;
    state: FiscalSubmissionState;
    endpoint: string;
    requestXml: string;
    requestHash: string;
    items: {
      create: SubmissionItemCreateData;
    };
  };
  include?: {
    items?: boolean;
  };
};

type SubmissionCreateResult = Omit<SubmissionCreateInput['data'], 'items'> & {
  id: string;
  items?: Array<
    SubmissionItemCreateData & {
      id: string;
    }
  >;
};

describe('FiscalSubmissionsService', () => {
  const companyId = '10000000-0000-4000-8000-000000000001';
  const recordId = '20000000-0000-4000-8000-000000000002';
  const chainId = '30000000-0000-4000-8000-000000000003';
  const submissionId = '40000000-0000-4000-8000-000000000004';

  const requestXml =
    '<?xml version="1.0" encoding="UTF-8"?><Envelope><Registro>TEST</Registro></Envelope>';

  const fiscalRecordFindFirst = jest.fn();
  const activeAttemptFindFirst = jest.fn();
  const attemptsAggregate = jest.fn();
  const submissionCreate =
    jest.fn<
      (input: SubmissionCreateInput) => Promise<SubmissionCreateResult>
    >();
  const transactionRunner = jest.fn();
  const generateAltaXml = jest.fn();
  let lastSubmissionCreateInput: SubmissionCreateInput | undefined;

  const transaction = {
    fiscalRecord: {
      findFirst: fiscalRecordFindFirst,
    },
    fiscalSubmissionItem: {
      findFirst: activeAttemptFindFirst,
      aggregate: attemptsAggregate,
    },
    fiscalSubmission: {
      create: submissionCreate,
    },
  };

  const prisma = {
    $transaction: transactionRunner,
  } as unknown as PrismaService;

  const fiscalXmlService = {
    generateAltaXml,
  } as unknown as FiscalXmlService;

  let service: FiscalSubmissionsService;
  let previousEndpointOverride: string | undefined;

  function getSubmissionCreateInput(): SubmissionCreateInput {
    if (!lastSubmissionCreateInput) {
      throw new Error('FiscalSubmission.create no recibió ningún argumento.');
    }

    return lastSubmissionCreateInput;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    lastSubmissionCreateInput = undefined;

    previousEndpointOverride = process.env.VERIFACTU_SOAP_ENDPOINT;
    delete process.env.VERIFACTU_SOAP_ENDPOINT;

    generateAltaXml.mockResolvedValue({
      xml: requestXml,
      fileName: 'factura-test.xml',
    });

    fiscalRecordFindFirst.mockResolvedValue({
      id: recordId,
      companyId,
      chainId,
      state: FiscalRecordState.PENDING_SUBMISSION,
      kind: FiscalRecordKind.ALTA,
      chain: {
        environment: FiscalEnvironment.TEST,
        installationNumber: '1',
      },
    });

    activeAttemptFindFirst.mockResolvedValue(null);

    attemptsAggregate.mockResolvedValue({
      _max: {
        attemptNumber: null,
      },
    });

    submissionCreate.mockImplementation(
      (input: SubmissionCreateInput): Promise<SubmissionCreateResult> => {
        lastSubmissionCreateInput = input;

        const { data, include } = input;

        return Promise.resolve({
          id: submissionId,
          companyId: data.companyId,
          chainId: data.chainId,
          environment: data.environment,
          installationNumber: data.installationNumber,
          state: data.state,
          endpoint: data.endpoint,
          requestXml: data.requestXml,
          requestHash: data.requestHash,
          items: include?.items
            ? [
                {
                  id: '50000000-0000-4000-8000-000000000005',
                  ...data.items.create,
                },
              ]
            : undefined,
        });
      },
    );

    transactionRunner.mockImplementation(
      async (
        callback: (transactionClient: typeof transaction) => Promise<unknown>,
      ) => callback(transaction),
    );

    service = new FiscalSubmissionsService(prisma, fiscalXmlService);
  });

  afterEach(() => {
    if (previousEndpointOverride === undefined) {
      delete process.env.VERIFACTU_SOAP_ENDPOINT;
    } else {
      process.env.VERIFACTU_SOAP_ENDPOINT = previousEndpointOverride;
    }
  });

  it('crea un FiscalSubmission pendiente con XML y hash inmutables', async () => {
    const result = await service.prepare(companyId, recordId);

    expect(generateAltaXml).toHaveBeenCalledTimes(1);
    expect(generateAltaXml).toHaveBeenCalledWith(companyId, recordId);

    expect(transactionRunner).toHaveBeenCalledTimes(1);

    expect(submissionCreate).toHaveBeenCalledTimes(1);

    const createInput = getSubmissionCreateInput();
    const requestHash = calculateSubmissionRequestHash(requestXml);

    expect(createInput.data).toEqual({
      companyId,
      chainId,
      environment: FiscalEnvironment.TEST,
      installationNumber: '1',
      state: FiscalSubmissionState.CREATED,
      endpoint:
        'https://prewww1.aeat.es/wlpl/TIKE-CONT/ws/SistemaFacturacion/VerifactuSOAP',
      requestXml,
      requestHash,
      items: {
        create: {
          fiscalRecordId: recordId,
          position: 1,
          attemptNumber: 1,
          operation: FiscalRecordKind.ALTA,
        },
      },
    });

    expect(createInput.data).not.toHaveProperty('certificateFingerprint');
    expect(result).toEqual(
      expect.objectContaining({
        id: submissionId,
        requestXml,
        requestHash,
        state: FiscalSubmissionState.CREATED,
      }),
    );
  });

  it('rechaza un registro fiscal que no existe para la empresa', async () => {
    fiscalRecordFindFirst.mockResolvedValue(null);

    await expect(service.prepare(companyId, recordId)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('rechaza registros que no estén pendientes de envío', async () => {
    fiscalRecordFindFirst.mockResolvedValue({
      id: recordId,
      companyId,
      chainId,
      state: FiscalRecordState.ACCEPTED,
      kind: FiscalRecordKind.ALTA,
      chain: {
        environment: FiscalEnvironment.TEST,
        installationNumber: '1',
      },
    });

    await expect(service.prepare(companyId, recordId)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('rechaza un nuevo envío cuando ya existe un intento activo', async () => {
    activeAttemptFindFirst.mockResolvedValue({
      submission: {
        id: submissionId,
        state: FiscalSubmissionState.SENDING,
      },
    });

    await expect(service.prepare(companyId, recordId)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(submissionCreate).not.toHaveBeenCalled();
  });

  it('incrementa el número de intento para un registro reenviado', async () => {
    attemptsAggregate.mockResolvedValue({
      _max: {
        attemptNumber: 2,
      },
    });

    await service.prepare(companyId, recordId);

    const createInput = getSubmissionCreateInput();

    expect(createInput.data.items.create.attemptNumber).toBe(3);
  });

  it('usa solamente un endpoint HTTPS configurado para el transporte', async () => {
    process.env.VERIFACTU_SOAP_ENDPOINT =
      'https://bridge-test.facturtaller.local/verifactu';

    await service.prepare(companyId, recordId);

    const createInput = getSubmissionCreateInput();

    expect(createInput.data.endpoint).toBe(
      'https://bridge-test.facturtaller.local/verifactu',
    );
  });

  it('rechaza una sobrescritura de endpoint que no use HTTPS', async () => {
    process.env.VERIFACTU_SOAP_ENDPOINT =
      'http://bridge-test.facturtaller.local/verifactu';

    await expect(service.prepare(companyId, recordId)).rejects.toThrow(
      'El endpoint SOAP VERI*FACTU debe usar HTTPS.',
    );

    expect(submissionCreate).not.toHaveBeenCalled();
  });
});
