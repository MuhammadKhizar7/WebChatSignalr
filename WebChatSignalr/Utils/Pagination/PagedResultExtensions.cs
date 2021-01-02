using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace WebChatSignalr.Utils.Pagination
{
    public static class PagedResultExtensions
    {
        public static PagedResult<T> GetPaged<T>(this IQueryable<T> query, int page, int pageSize)
        {
            var result = new PagedResult<T>
            {
                CurrentPage = page,
                PageSize = pageSize,
                RowCount = query.Count()
            };

            var pageCount = (double) result.RowCount / pageSize;
            result.PageCount = (int) Math.Ceiling(pageCount);

            var skip = (page - 1) * pageSize;
            result.Results = query.Skip(skip).Take(pageSize).ToList();

            return result;
        }

        public static async Task<PagedResult<T>> GetPagedAsync<T>(this IQueryable<T> query, int page, int pageSize)
        {
            var result = new PagedResult<T>
            {
                CurrentPage = page,
                PageSize = pageSize,
                RowCount = await query.CountAsync()
            };

            var pageCount = (double) result.RowCount / pageSize;
            result.PageCount = (int) Math.Ceiling(pageCount);

            var skip = (page - 1) * pageSize;
            result.Results = await query.Skip(skip).Take(pageSize).ToListAsync();

            return result;
        }

        // public static PagedResult<U> GetPaged<T, U>(this IQueryable<T> query, int page, int pageSize) where U : class
        // {
        //     var result = new PagedResult<U>();
        //     result.CurrentPage = page;
        //     result.PageSize = pageSize;
        //     result.RowCount = query.Count();
        //
        //     var pageCount = (double)result.RowCount / pageSize;
        //     result.PageCount = (int)Math.Ceiling(pageCount);
        //
        //     var skip = (page - 1) * pageSize;
        //     result.Results = query.Skip(skip)
        //                           .Take(pageSize)
        //                           .ProjectTo<U>()
        //                           .ToList();
        //     return result;
        // }
        //
        // public static async Task<PagedResult<U>> GetPagedAsync<T, U>(this IQueryable<T> query, int page, int pageSize) where U : class
        // {
        //     var result = new PagedResult<U>();
        //     result.CurrentPage = page;
        //     result.PageSize = pageSize;
        //     result.RowCount = await query.CountAsync();
        //
        //     var pageCount = (double)result.RowCount / pageSize;
        //     result.PageCount = (int)Math.Ceiling(pageCount);
        //
        //     var skip = (page - 1) * pageSize;
        //     result.Results = await query.Skip(skip)
        //                                 .Take(pageSize)
        //                                 .ProjectTo<U>()
        //                                 .ToListAsync();
        //     return result;
        // }
    }

    public class PagedResult<T> : PagedResultBase
    {
        public List<T> Results { get; set; }

        public PagedResult()
        {
            Results = new List<T>();
        }
    }

    public abstract class PagedResultBase
    {
        public int CurrentPage { get; set; }

        public int PageCount { get; set; }

        public int PageSize { get; set; }

        public int RowCount { get; set; }
        public string LinkTemplate { get; set; }

        public int FirstRowOnPage => (CurrentPage - 1) * PageSize + 1;

        public int LastRowOnPage => Math.Min(CurrentPage * PageSize, RowCount);
    }
}