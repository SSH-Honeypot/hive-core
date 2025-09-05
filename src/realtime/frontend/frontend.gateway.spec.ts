import { Test, TestingModule } from '@nestjs/testing';
import { FrontendGateway } from './frontend.gateway';

describe('FrontendGateway', () => {
  let gateway: FrontendGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FrontendGateway],
    }).compile();

    gateway = module.get<FrontendGateway>(FrontendGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
