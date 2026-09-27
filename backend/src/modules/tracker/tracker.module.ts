import { Module, Global } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { TrackerController } from './tracker.controller';

@Global() // Make TrackerService injectable anywhere
@Module({
    controllers: [TrackerController],
    providers: [TrackerService],
    exports: [TrackerService],
})
export class TrackerModule {}
