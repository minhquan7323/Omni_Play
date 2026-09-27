import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetJwtUser = createParamDecorator(
    (data: string | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;

        if (!user) return null;

        if (data) return user[data];

        return user;
    },
);
