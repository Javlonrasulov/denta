import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesController } from './files.controller';
import { LocalStorageService } from './local-storage.service';
import { S3StorageService } from './s3-storage.service';
import { STORAGE_SERVICE, StorageService } from './storage.types';

@Global()
@Module({
  controllers: [FilesController],
  providers: [
    LocalStorageService,
    S3StorageService,
    {
      provide: STORAGE_SERVICE,
      inject: [ConfigService, LocalStorageService, S3StorageService],
      useFactory: (
        config: ConfigService,
        local: LocalStorageService,
        s3: S3StorageService,
      ): StorageService => {
        const driver = (
          config.get<string>('app.storage.driver') ?? 'local'
        ).toLowerCase();
        if (driver === 's3') return s3;
        return local;
      },
    },
  ],
  exports: [STORAGE_SERVICE, LocalStorageService, S3StorageService],
})
export class StorageModule {}
