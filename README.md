# fastpress

fast and simple static site generator

## Getting Started

### Install

```console
$ npm i -D @day1co/fastpress
```

### Create New Site

```console
$ npx fastpress site
```

### Create New Page

```console
$ npx fastpress page
```

### Create New Post

```console
$ npx fastpress post
```

### Build All

```console
$ npx fastpress build
```

* Watch Changes and Build(expremental)
 
```console
$ npx fastpress watch
```

### preview with local http server

```console
$ npx http-server out/
```

see [http-server]()

### deploy to github pages

```console
$ npx gh-pages -d out/
```

see [gh-pages]()

## Internals

### Directory Structure

```
+ pages/     
  - index.md
  + about/
    - index.md
  + posts/
    - index.md
    + slug
      - index.md
  - ...
+ public/  
  - favicon.ico
  - ... 
+ layouts/
  - default.ejs
  - page.ejs
  - post.ejs
  - ...
```

### Custom Layout

see [ejs]()

---
May the **SOURCE** be with you...
