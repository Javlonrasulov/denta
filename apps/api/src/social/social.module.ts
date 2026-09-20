import { Module } from '@nestjs/common';
import {
  FavoritesController,
  ReviewsController,
} from './social.controller';

@Module({
  controllers: [FavoritesController, ReviewsController],
})
export class SocialModule {}
