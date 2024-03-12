const { test, expect, beforeEach, describe } = require('@playwright/test')
const helper = require('./testing_helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen',
      },
    })

    await page.goto('http://localhost:5173')
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
})
