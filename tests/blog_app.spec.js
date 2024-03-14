const { test, expect, beforeEach, describe } = require('@playwright/test')
const helper = require('./testing_helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('/api/testing/reset')
    await request.post('/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen',
      },
    })

    await page.goto('/')
  })

  test('Login form is shown', async ({ page }) => {
    const loginForm = page.getByTestId('login-form')
    await expect(loginForm).toBeVisible()
  })

  describe('login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await helper.login(page, 'mluukkai', 'salainen')
      const loginMessage = page.getByText('Matti Luukkainen logged in')
      await expect(loginMessage).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await helper.login(page, 'mluukkai', 'wrongpassword')
      const errorMessage = page.getByText('wrong username or password')
      await expect(errorMessage).toBeVisible()
      await expect(errorMessage).toHaveCSS('color', 'rgb(255, 0, 0)')

      const loginMessage = page.getByText('Matti Luukkainen logged in')
      await expect(loginMessage).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await helper.login(page, 'mluukkai', 'salainen')
    })

    test('a new blog can be created', async ({ page }) => {
      const blogToAdd = {
        title: 'Best Blog Ever',
        author: 'John Doe',
        url: 'example.com',
      }

      await helper.createBlog(page, blogToAdd)

      const renderedBlog = page.getByTestId('blog').getByText(blogToAdd.title)
      await expect(renderedBlog).toBeVisible()
    })

    describe('When user has a blog', () => {
      const blog = {
        title: 'Best Blog Ever',
        author: 'John Doe',
        url: 'example.com',
      }
      beforeEach(async ({ page }) => {
        await helper.createBlog(page, blog)
      })

      test('blog can be edited', async ({ page }) => {
        const blogContainer = await helper.expandBlogByTitle(page, blog.title)

        const blogLikes = blogContainer.getByText('likes')
        const numLikesBefore = +(await blogLikes.textContent()).match(/\d+/)[0]

        const likeBtn = blogContainer.getByRole('button', { name: 'like' })
        await likeBtn.click()

        await expect(blogLikes).toContainText(`likes ${numLikesBefore + 1}`)
      })

      test('blog can be deleted', async ({ page }) => {
        const blogContainer = await helper.expandBlogByTitle(page, blog.title)

        // Confirm deletion with the modal
        page.on('dialog', (dialog) => dialog.accept())
        await blogContainer.getByRole('button', { name: 'remove' }).click()
        await expect(blogContainer).not.toBeVisible()
      })

      test("delete button only visible to blog's creator", async ({ page, request }) => {
        let blogContainer = await helper.expandBlogByTitle(page, blog.title)
        // Make sure user can see delete button
        await expect(blogContainer.getByRole('button', { name: 'remove' })).toBeVisible()
        await helper.logout(page)

        // Log into another account
        await request.post('/api/users', {
          data: {
            name: 'Eve',
            username: 'evie',
            password: 'password',
          },
        })
        await helper.login(page, 'evie', 'password')
        blogContainer = await helper.expandBlogByTitle(page, blog.title)
        // Make sure other user can't see the delete button
        await expect(blogContainer.getByRole('button', { name: 'remove' })).not.toBeVisible()
      })
    })

    describe('When user has several blogs with likes', () => {
      const blogs = [
        {
          title: 'How to Blog',
          author: 'Ron Bo',
          url: 'blogginlife.net',
          likes: 15,
        },
        {
          title: 'Best Blog Ever',
          author: 'John Doe',
          url: 'example.com',
          likes: 21,
        },
        {
          title: 'Some Other Blog',
          author: 'Bob Doe',
          url: 'something.com',
          likes: 4,
        },
        {
          title: 'Not a Blog',
          author: 'Nonblogger',
          url: 'golb.com',
          likes: 9,
        },
      ]
      beforeEach(async ({ page }, testInfo) => {
        testInfo.setTimeout(30000);
        // Create blogs with the set number of likes
        for (const blog of blogs) {
          await helper.createBlog(page, blog)
          const blogContainer = await helper.expandBlogByTitle(page, blog.title)
          const blogLikes = blogContainer.getByText('likes')
          const likeBtn = blogContainer.getByRole('button', { name: 'like' })
          for (let i = 0; i < blog.likes; i++) {
            const numLikesBefore = +(await blogLikes.textContent()).match(/\d+/)[0]

            await likeBtn.click()

            // Wait for number of likes to update
            await blogLikes.filter({ hasText: `likes ${numLikesBefore + 1}` }).waitFor({ timeout: 10000 })
          }
        }
      })
      test('blogs are ordered with most likes first', async ({ page }) => {
        const sortedBlogs = blogs.toSorted((blog1, blog2) => blog2.likes - blog1.likes)
        const blogLocators = await page.getByTestId('blog').all()
        for (let i = 0; i < blogLocators.length; i++) {
          await expect(blogLocators[i]).toContainText(`likes ${sortedBlogs[i].likes}`)
        }
      })
    })
  })
})
