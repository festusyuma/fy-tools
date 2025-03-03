import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import {PaginationData} from "@fy-tools/rpc-server";

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): PaginationData => {
    const request = ctx.switchToHttp().getRequest();

    const page = Number(request.query.page ?? 0);
    const size = Number(request.query.size ?? 10);
    const totalPages = Number(request.query.size ?? 0);
    const totalItems = Number(request.query.size ?? 0);

    return { page, size, totalPages, totalItems };
  }
);
