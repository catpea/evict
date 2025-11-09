import { BlogPage } from 'aggressive';

import path from 'path';
import { writeFile, mkdir } from 'node:fs/promises';


export default class Tiny {
  async render(service, website) {

    console.log('Woot woot! Tiny Render Got Website!', website);
    await mkdir(service.location, {recursive: true});

    for await (const book of await website.books()) {
      console.log('Tiny>>> ', book.name);
      // book.id = furkies-purkies
      // book.name
      // book.posts
      // book.pages
      for await (const page of await book.pages()) {
        // page.posts()
        // page.isHome
        // page.fileName
        // page.pager

        const blogPage = new BlogPage({
          title: 'My Awesome Blog',
          subtitle: 'Where I share my thoughts',
        });

        blogPage.setPagerLinks(page.pager)

        for await (const post of await page.posts()) {
          // post has post.json fileds
          // console.log(post.title)

          blogPage.addPost({
            title: post.title,
            date: 'Nov 8, 2025',
            datetime: '2025-11-08',
            content: '<p>Hello, classless world!</p>',
          });

        } // posts

        // console.log(page.pager)
        // process.exit();
        const blogPagePath = path.join( service.location, page.fileName)
        await writeFile(blogPagePath, blogPage.render());

      } // page



    } // books
  } // render
}
