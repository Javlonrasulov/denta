import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  number!: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class PatchRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsEnum(['available', 'occupied', 'maintenance'])
  status?: 'available' | 'occupied' | 'maintenance';
}
