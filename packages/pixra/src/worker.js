export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        // 将 /docs/* 请求转发给 docs worker
        if (url.pathname.startsWith('/docs')) {
            return env.DOCS.fetch(request);
        }
        // 其他请求由静态资源处理
        return env.ASSETS.fetch(request);
    },
};
