# aaronmeese.com

This site is based off the template of the [Developer's Portfolio](https://github.com/hashirshoaeb/home)
project, which was released under the GNU Lesser General Public License v3.0.

The React code here deploys the code to my [GitHub pages](https://ajmeese7.github.io) repo,
which [aaronmeese.com](https://aaronmeese.com) is pointing to for hosting.

To build and deploy to GitHub pages, run `npm run build` then `npm run custom-deploy`. You'll want
to have the CNAME file inside `/public` if you plan on implementing custom domain support, otherwise
it'll be overwritten every commit.

If you want to start it up locally, run `npm run start`.

## Desktop TODOs

- Figure out how to change the PDF favicon
- Testimonial picture format in configurations like the following:
  - `` <img src={`https://github.com/${username}.png`} className="card-img-top" alt="..." /> ``
- After I get more testimonials from people, look into redoing the section to
  look more like [this](https://launchschool.com/results).
- Make popular and recent slideshow style, so you can click between them
- Add claps like stars for Medium, then fix them in the same way as the other sections
  - Add an hourly ms param to update the cache every hour for Cloudflare Workers
  - Add a similar `Load More` button to testimonials, where the `index > 1` can be
    incremented somehow. Try to fade in the new ones gracefully.

## Mobile TODOs

- Make the nav look better
- See if I can break up the long list of social icons, it's too much
- Fix the titles lookily choppily inserted
- Make the stars and date break lines instead of pinching together
- Limit testimonials and include a `Load More` button
