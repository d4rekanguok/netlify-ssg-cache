# Netlify SSG Cache

> ⚠ Work-in-progress.

Same idea as [`gatsby-plugin-netlify-cache`](https://github.com/axe312ger/gatsby-plugin-netlify-cache), but doesn't hook directly into Gatsby. It wraps around build command instead, i.e you'd run `netlify-ssg-cache` instead of `gatsby build`.

### Why

I wrote a plugin that support remote images in markdown. It doesn't work with `gatsby-plugin-netlify-cache`: Gatsby invalidates the cache on bootstrap. [See the discussion here for more info](https://github.com/d4rekanguok/gatsby-remark-images-anywhere/issues/11).

### How to use

Install

```bash
yarn add netlify-ssg-cache@alpha
```

In your package.json:

```json
{
  "scripts": {
    "build:netlify": "SSG=gatsby netlify-ssg-cache",
    "build": "gatsby build",
  }
}
```

- Use `yarn build:netlify
` as your build script on Netlify.
- You'll still need the `build` script. This package will just run your build command.


### What's Next

- Allow caching arbitrary directories
- Invalidate files stored in cache
- Specify a base directory