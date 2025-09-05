import { Test, TestingModule } from '@nestjs/testing';
import { CowrieGateway } from './cowrie.gateway';

describe('CowrieGateway', () => {
  let gateway: CowrieGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CowrieGateway],
    }).compile();

    gateway = module.get<CowrieGateway>(CowrieGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
