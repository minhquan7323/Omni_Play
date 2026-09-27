import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { WhiteboardGateway } from './whiteboard.gateway';
import { WhiteboardService } from './whiteboard.service';
import { WhiteboardController } from './whiteboard.controller';
import { Board, BoardSchema } from './schemas/board.schema';
import { BoardData, BoardDataSchema } from './schemas/board-data.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Board.name, schema: BoardSchema },
            { name: BoardData.name, schema: BoardDataSchema },
        ]),
        JwtModule.register({}),
    ],
    controllers: [WhiteboardController],
    providers: [WhiteboardGateway, WhiteboardService],
})
export class WhiteboardModule {}
