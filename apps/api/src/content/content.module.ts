import { Module } from '@nestjs/common';
import { createCollectionControllers } from './collection.controllers';
import { CollectionService } from './collection.service';
import { COLLECTIONS } from './collections';

@Module({
  controllers: COLLECTIONS.flatMap(createCollectionControllers),
  providers: [CollectionService],
})
export class ContentModule {}
