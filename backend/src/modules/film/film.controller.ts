import { GetJwtUser } from '@/common/decorators/get-user.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AtGuard } from '../auth/guards';
import { FilmService } from './film.service';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@Controller('film')
export class FilmController {
    constructor(private readonly filmService: FilmService) {}

    @Get('new')
    @ResponseMessage('Get new movies successfully')
    async getNewMovies(@Query('page') page = '1') {
        return this.filmService.getNewMovies(+page);
    }

    @Get('list')
    @ResponseMessage('Get movie list successfully')
    async getMovieList(
        @Query() { type, category, country, year, page }: PaginationQueryDto,
    ) {
        return this.filmService.getMovieList({
            type,
            category,
            country,
            year,
            page,
        });
    }

    @Get('search')
    @ResponseMessage('Search movies successfully')
    async searchMovies(@Query() query: PaginationQueryDto) {
        return this.filmService.searchMovies(query);
    }

    @Get('categories')
    @ResponseMessage('Get categories successfully')
    async getCategories() {
        return this.filmService.getCategories();
    }

    @Get('countries')
    @ResponseMessage('Get countries successfully')
    async getCountries() {
        return this.filmService.getCountries();
    }

    @Get('category/:slug')
    @ResponseMessage('Get movies by category successfully')
    async getMoviesByCategory(
        @Param('slug') slug: string,
        @Query('page') page = '1',
    ) {
        return this.filmService.getMoviesByCategory(slug, +page);
    }

    @Get('country/:slug')
    @ResponseMessage('Get movies by country successfully')
    async getMoviesByCountry(
        @Param('slug') slug: string,
        @Query('page') page = '1',
    ) {
        return this.filmService.getMoviesByCountry(slug, +page);
    }

    @Get('detail/:slug')
    @ResponseMessage('Get movie detail successfully')
    async getMovieDetail(@Param('slug') slug: string) {
        return this.filmService.getMovieDetail(slug);
    }

    // ─── Auth-required endpoints ─────────────────────────────────────────────
    @Post('history')
    @UseGuards(AtGuard)
    @ResponseMessage('Save watch history successfully')
    async saveHistory(@GetJwtUser('sub') userId: string, @Body() dto: any) {
        return this.filmService.saveWatchHistory(userId, dto);
    }

    @Get('history')
    @UseGuards(AtGuard)
    @ResponseMessage('Get watch history successfully')
    async getHistory(@GetJwtUser('sub') userId: string) {
        return this.filmService.getWatchHistory(userId);
    }

    @Delete('history/:id')
    @UseGuards(AtGuard)
    @ResponseMessage('Delete watch history successfully')
    async deleteHistory(
        @GetJwtUser('sub') userId: string,
        @Param('id') id: string,
    ) {
        return this.filmService.removeHistory(userId, id);
    }

    @Post('favorites/toggle')
    @UseGuards(AtGuard)
    @ResponseMessage('Update favorite status successfully')
    async toggleFavorite(@GetJwtUser('sub') userId: string, @Body() dto: any) {
        return this.filmService.toggleFavorite(userId, dto);
    }

    @Delete('favorites/:externalFilmId')
    @UseGuards(AtGuard)
    @ResponseMessage('Delete favorite successfully')
    async deleteFavorite(
        @GetJwtUser('sub') userId: string,
        @Param('externalFilmId') externalFilmId: string,
    ) {
        return this.filmService.removeFavorite(userId, externalFilmId);
    }

    @Get('favorites')
    @UseGuards(AtGuard)
    @ResponseMessage('Get favorite movies successfully')
    async getFavorites(@GetJwtUser('sub') userId: string) {
        return this.filmService.getFavorites(userId);
    }

    @Get('favorites/check/:externalFilmId')
    @UseGuards(AtGuard)
    @ResponseMessage('Check favorite status successfully')
    async checkFavorite(
        @GetJwtUser('sub') userId: string,
        @Param('externalFilmId') externalFilmId: string,
    ) {
        return this.filmService.checkFavorite(userId, externalFilmId);
    }

    @Get('history/check/:externalFilmId')
    @UseGuards(AtGuard)
    @ResponseMessage('Check watch history successfully')
    async checkWatchHistory(
        @GetJwtUser('sub') userId: string,
        @Param('externalFilmId') externalFilmId: string,
    ) {
        return this.filmService.checkWatchHistory(userId, externalFilmId);
    }
}
