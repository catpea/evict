import { BlogPage } from 'aggressive';

import runstop from 'runstop';

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
          title: service.title,
          subtitle: service.subtitle,
        });


// Set the logo - one semantic action
blogPage.setLogo({
  src: 'logo.svg',
  alt: 'Site logo',
  caption: 'BeautifulWeb'
});

// Add navigation - semantic links, not divs and classes
blogPage.setNavLinks([
  { text: 'Home', href: '/', ariaCurrent: 'page' },
  { text: 'Poetry', href: '/poetry' },
  { text: 'Work', href: '/work' },

]);

// Add sidebar categories - semantic organization
blogPage.setCategories([
  { text: 'Programming', href: 'programming.html' },
  { text: 'Philosophy', href: 'philosophy.html' },
  { text: 'Humanity', href: 'humanity.html' },
  { text: 'Longevity', href: 'longevity.html' },
]);

        blogPage.setPagerLinks(page.pager)

        for await (const post of await page.posts()) {
          // post has post.json fileds
          // console.log(post.title)

          blogPage.addPost({
            title: post.title,
            date: post.date,
            content: '<p>Hello, classless world!</p>',
            url: `/permalink/${post.guid}/`,
          });


          // await runstop({ post });

        } // posts

        // console.log(page.pager)
        // process.exit();
        const blogPagePath = path.join( service.location, page.fileName)
        await writeFile(blogPagePath, blogPage.render());

      } // page



    } // books
  } // render
}
