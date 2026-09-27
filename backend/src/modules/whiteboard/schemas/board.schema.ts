import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { BoardMember, BoardMemberSchema } from './board-member.schema';

@Schema({ timestamps: true })
export class Board extends Document {
    @Prop({
        required: true,
        index: true,
        unique: true,
        default: () => uuidv4(),
    })
    boardId!: string;

    @Prop({ required: true, default: 'Untitled Board' })
    name!: string;

    @Prop({ required: true })
    ownerId!: string;

    @Prop({ default: false })
    isPrivate!: boolean;

    @Prop({ type: String, required: false, select: false })
    password?: string;

    @Prop({ type: String, default: '' })
    thumbnailUrl?: string;

    @Prop({ type: [BoardMemberSchema], default: [] })
    members!: BoardMember[];

    @Prop({ type: [String], default: [] })
    bannedUserIds!: string[];
}

export const BoardSchema = SchemaFactory.createForClass(Board);
