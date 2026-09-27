import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BoardRole } from '../constants/whiteboard.constant';

@Schema({ _id: false })
export class BoardMember {
    @Prop({ required: true })
    userId!: string;

    @Prop({ type: String, enum: BoardRole, default: BoardRole.VIEWER })
    role!: BoardRole;
}

export const BoardMemberSchema = SchemaFactory.createForClass(BoardMember);
