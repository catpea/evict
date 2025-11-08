export default class Service {

  async build(website){
    const books = await website.books();
    console.log(`publishing ${books.length} book(s).`)

    for await (const book of books) {
      for await (const page of await book.pages()) {
        for await (const post of await page.posts()) {
          // ...
        }
      }
    }

    const posts = await website.posts();
    for await (const post of posts) {
      // ...
    }

    const pages = await website.pages();
    for await (const page of pages) {
      // ...
    }

  }

  publish(){}

  uniqueId(length){
    return Math.random().toString(36).substring(2, length);
  }

}
