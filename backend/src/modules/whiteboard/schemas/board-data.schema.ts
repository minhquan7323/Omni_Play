import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true, minimize: false })
export class BoardData extends Document {
    @Prop({ required: true, index: true, unique: true })
    boardId!: string;

    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    records!: Record<string, any>;
}

export const BoardDataSchema = SchemaFactory.createForClass(BoardData);
