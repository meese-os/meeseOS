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
- Separate nav sections for popular and recent repositories
- Testimonial picture format in configurations like the following:
    - ```<img src={`https://github.com/${username}.png`} className="card-img-top" alt="..." />```

## Mobile TODOs
- Make the nav look better
- Make description look better
- See if I can break up the long list of social icons, it's too much
- Fix the titles lookily choppily inserted
- Make the stars and date break lines instead of pinching together