export function paginate(items, request, { defaultLimit = 10, maxLimit = 50 } = {}) {
  const page = Math.max(1, Number(request.queryParams.page) || 1);
  const requestedLimit = Number(request.queryParams.limit) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
  const total = items.length;
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: start + limit < total,
      hasPrev: page > 1,
    },
  };
}
