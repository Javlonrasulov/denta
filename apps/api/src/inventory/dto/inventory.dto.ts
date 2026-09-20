import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateInventoryItemDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  unit!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  minimumStock!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  purchasePrice!: number;

  @IsOptional()
  @IsString()
  supplier?: string;
}

export class InventoryMoveDto {
  @IsEnum(['IN', 'OUT', 'ADJUSTMENT'])
  type!: 'IN' | 'OUT' | 'ADJUSTMENT';

  @Type(() => Number)
  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
