import { For, Show, JSX } from "solid-js";

import "./pagination.component.css";
import { c } from "vinxi/dist/types/lib/logger";



export type PaginationComponentProps = {
    total: number,
    perPage: number,
    currentPage: number,
    range?: number,
    onPageChange: (page: number) => void
    children: JSX.Element
}

export function PaginationComponent(props: PaginationComponentProps) {
    
    const pageIndex = () => {
        const pages = Math.ceil(props.total / props.perPage);
        const keys = [...Array(pages).keys()];
        return keys;
    }

        const range = () => {
        return props.range || 10;
    }

    const leftIndex = () => {
        const index = props.currentPage - 1;
        const block = index > 0 ? Math.floor(index / range()) : 0;
        const left = block * range();
        return left < 0 ? 0 : left;
    }

    const rightIndex = () => {
        const right = leftIndex() + range();
        return right > pageIndex().length ? pageIndex().length : right;
    }

    const firstIndex = () => {
        return pageIndex()[0];
    }

    const lastIndex = () => {
        return pageIndex()[pageIndex().length - 1];
    }

    const handlePageChange = (page: number) => {

        const firstPage = firstIndex() + 1;
        const lastPage = lastIndex() + 1;
        
        const limitedPage = (() => {
            if (page < firstPage) return firstPage;
            if (page > lastPage) return lastPage;
            return page;
        })();

        console.debug(`Changing page from ${props.currentPage} to ${limitedPage}`);

        props.onPageChange(limitedPage);

    }

    console.debug(`Total: ${props.total}, perPage: ${props.perPage}, currentPage: ${props.currentPage}, range: ${props.range}, left: ${leftIndex()}, right: ${rightIndex()}`);
    


    return (
        <div class="pagination-container">
            <div class="pagination-page">{props.children}</div>
            <nav class="pagination-nav">
                <ul class="pagination justify-content-center">
                    <li class={`page-item ${props.currentPage <= 1 && "disabled"}`}>
                        <button type="button" class="page-link" onClick={() => handlePageChange(props.currentPage - range())}>
                            <i class="bi bi-chevron-double-left" />
                        </button>
                    </li>
                    <li class={`page-item ${props.currentPage <= 1 && "disabled"}`}>
                        <button class="page-link" onClick={() => handlePageChange(props.currentPage - 1)} disabled={props.currentPage === 1}>
                            <i class="bi bi-chevron-left" />
                        </button>
                    </li>
                    <For each={pageIndex().slice(leftIndex(), rightIndex())}>
                        {page => (
                            <li class="page-item">
                                <button class={`page-link ${props.currentPage === page + 1 && "active"}`} onClick={() => handlePageChange(page + 1)}>{page + 1}</button>
                            </li>
                        )}
                    </For>
                    <li class={`page-item ${props.currentPage >= pageIndex().length && "disabled"}`}>
                        <button class="page-link" onClick={() => handlePageChange(props.currentPage + 1)}>
                            <i class="bi bi-chevron-right" />
                        </button>
                    </li>
                    <li class={`page-item ${props.currentPage >= pageIndex().length && "disabled"}`}>
                        <button type="button" class="page-link" onClick={() => handlePageChange(props.currentPage + range())}>
                            <i class="bi bi-chevron-double-right" />
                        </button>
                    </li>
                    <li class="page-item disabled">
                        <span class="page-link">Pages {pageIndex().length}</span>
                    </li>
                    <li class="page-item disabled">
                        <span class="page-link">Total {props.total}</span>
                    </li>
                </ul>
            </nav>
        </div>
    )
}