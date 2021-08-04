import { PageObjects } from './admin-objects'
import { browser, ExpectedConditions } from 'protractor'

const e2eUser = {
  email: 'admin@e2e.com',
  pass: 'admin123',
  username: 'Admin e2e',
  $key: 'duAQ5FmWcYQunzuQ7z9y'
}

const timeout = 50000

const testCard = [
  'Admin e2e',
  '4111111111111111',
  12,
  22,
  332
]

describe('Admin tests', () => {
  const page: PageObjects = new PageObjects()
  
  it('Display welcome message', () => {
    page.navigateTo('login')
    
    expect(page.getTitleText()).toEqual('¡Bienvenido a Carpe Diem!')
  })
  
  it('Sign in as admin user', async() => {
    const { email, pass } = e2eUser
    const submitBtn = page.getSubmitBtn()
    const emailInput = page.getEmailInput()
    const passInput = page.getPasswordInput()
    
    emailInput.sendKeys(email)
    passInput.sendKeys(pass)
    submitBtn.click()
    
    const url = await browser.wait(ExpectedConditions.urlContains('admin/home'), timeout)
    
    expect(url).toEqual(true)
  })

  it('Create new class', async() => {
    const createClassBtn = page.getCreateClassBtn()
    page.navigateTo('admin/classes')
    browser.wait(ExpectedConditions.visibilityOf(createClassBtn), timeout)
    createClassBtn.click()
    browser.sleep(1000)

    page.getInstructorSelect().click()
    page.getnstructorOption().click()
    page.getClassTypeSelect().click()
    page.getClassTypeOption().click()
    page.getStudioSelect().click()
    page.getStudioOption().click()
    page.getRepeatSelect().click()
    page.getRepeatOption().click()
    page.getColorSelect().click()
    page.getColorOption().click()

    page.getDateInput().sendKeys('4/12/2019')

    page.getStartTimeInput().click()

    browser.actions().mouseMove(page.getClockOption(0)).click().perform()
    browser.actions().mouseMove(page.getClockOption(1)).click().perform()
    browser.actions().mouseMove(page.getClickOkBtn()).click().perform()

    page.getEndTimeInput().click()

    browser.actions().mouseMove(page.getClockOption(0)).click().perform()
    browser.actions().mouseMove(page.getClockOption(1)).click().perform()
    browser.actions().mouseMove(page.getClickOkBtn()).click().perform()

    page.getSubmitBtn()
  })
})
