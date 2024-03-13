const login = async (page, username, password) => {
  const loginForm = page.getByTestId('login-form')
  const usernameInput = loginForm.getByText('username').getByRole('textbox')
  const passwordInput = loginForm.getByText('password').getByRole('textbox')
  const loginBtn = loginForm.getByRole('button', { name: 'login' })
  await usernameInput.fill(username)
  await passwordInput.fill(password)
  await loginBtn.click()
}

const createBlog = async (page, blogToAdd) => {
  await page.getByRole('button', { name: 'create new blog' }).click()
  await page.locator('#title').fill(blogToAdd.title)
  await page.locator('#author').fill(blogToAdd.author)
  await page.locator('#url').fill(blogToAdd.url)
  await page.getByRole('button', { name: 'create' }).click()
}

module.exports = { login, createBlog }
