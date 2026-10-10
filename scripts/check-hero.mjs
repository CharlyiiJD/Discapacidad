import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

await mkdir('artifacts', { recursive: true })
const browser = await chromium.launch({ channel: 'msedge', headless: true })
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: width === 390 ? 'reduce' : 'no-preference' })
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' })
    const hero = page.locator('.university-hero')
    const swiper = hero.locator('.swiper')
    await expect.poll(() => swiper.evaluate((node) => Boolean(node.swiper?.initialized))).toBe(true)
    assert.equal(await swiper.evaluate((node) => Boolean(node.swiper.autoplay?.running)), false)
    await expect(hero.getByRole('checkbox')).toHaveCount(0)
    await expect(hero.locator('.hero-controls button')).toHaveCount(2)
    const index = () => swiper.evaluate((node) => node.swiper.activeIndex)
    let previous = await index()
    await page.waitForTimeout(8000)
    assert.equal(await index(), previous)
    const next = hero.getByRole('button', { name: 'Botón para mostrar la imagen siguiente' })
    await next.focus()
    previous = await index()
    await next.press('Enter')
    await expect.poll(index).not.toBe(previous)
    await page.locator('.brand-link').focus()
    previous = await index()
    await page.waitForTimeout(8000)
    assert.equal(await index(), previous)
    await hero.getByRole('button', { name: 'Botón para mostrar la imagen anterior' }).click()
    await expect.poll(index).not.toBe(previous)
    const programSwiper = page.locator('.program-carousel')
    const programIndex = () => programSwiper.evaluate((node) => node.swiper.activeIndex)
    const initialProgram = await programIndex()
    await page.getByRole('button', { name: 'Mostrar las carreras siguientes' }).click()
    await expect.poll(programIndex).not.toBe(initialProgram)
    await page.getByRole('button', { name: 'Mostrar las carreras anteriores' }).press('Enter')
    await expect.poll(programIndex).toBe(initialProgram)
    assert.equal(await programSwiper.evaluate((node) => Boolean(node.swiper.autoplay?.running)), false)
    await page.screenshot({ path: `artifacts/hero-${width}.png` })
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
    assert.deepEqual(errors, [])
    console.log(`Carruseles ${width}px: sin avance automático, flechas y teclado comprobados`)
    await page.close()
  }
} finally {
  await browser.close()
}
