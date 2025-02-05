import * as glassEasel from '../../src'
import {
  composedBackend, tmpl,
} from '../base/env'

describe('Component Space', () => {
  test('update and get component options', () => {
    const cs = new glassEasel.ComponentSpace()
    const fakeTmplEngine = {} as glassEasel.templateEngine.TemplateEngine
    cs.updateComponentOptions({
      templateEngine: fakeTmplEngine,
    })
    expect(cs.getComponentOptions().templateEngine).toBe(fakeTmplEngine)
  })

  test('create with default component specified', () => {
    const cs = new glassEasel.ComponentSpace('def')
    const def = cs.defineComponent({ is: 'def' })
    expect(cs.getDefaultComponent()).toBe(def)
    expect(cs.isDefaultComponent(def)).toBe(true)
    expect(cs.getComponentByUrl('not/found', '')).toBe(def)
  })

  test('search component with relative and absolute paths', () => {
    const cs = new glassEasel.ComponentSpace()
    const def = cs.defineComponent({ is: 'a/comp' })
    expect(cs.getComponentByUrl('comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('./comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('../a/comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('../a/./comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('../../a/comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('/a/comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrl('/a/../a/comp', 'a/test')).toBe(def)
    expect(cs.getComponentByUrlWithoutDefault('/comp', 'a/test')).toBe(null)
  })

  test('create with base space', () => {
    const baseCs = new glassEasel.ComponentSpace()
    const baseBeh = baseCs.defineBehavior({ is: 'base/beh/inner' })
    baseCs.exportBehavior('base/beh', 'base/beh/inner')
    const baseComp = baseCs.defineComponent({ is: 'base/comp/inner' })
    baseCs.exportComponent('base/comp', 'base/comp/inner')
    const cs = new glassEasel.ComponentSpace('', baseCs)
    const baseBeh2 = baseCs.defineBehavior({ is: 'base/beh/inner2' })
    baseCs.exportBehavior('base/beh2', 'base/beh/inner2')
    const baseComp2 = baseCs.defineComponent({ is: 'base/comp/inner2' })
    baseCs.exportComponent('base/comp2', 'base/comp/inner2')
    expect(cs.getBehaviorByUrl('base/beh', '')).toBe(baseBeh)
    expect(baseCs.getBehaviorByUrl('base/beh/inner2', '')).toBe(baseBeh2)
    expect(baseCs.getBehaviorByUrl('base/beh2', '')).toBe(null)
    expect(cs.getBehaviorByUrl('base/beh2', '')).toBe(null)
    expect(cs.getComponentByUrl('base/comp', '')).toBe(baseComp)
    expect(baseCs.getComponentByUrlWithoutDefault('base/comp/inner2', '')).toBe(baseComp2)
    expect(baseCs.getComponentByUrlWithoutDefault('base/comp2', '')).toBe(null)
    expect(cs.getComponentByUrlWithoutDefault('base/comp2', '')).toBe(null)
    const newBeh = cs.defineBehavior({ is: 'base/beh' })
    const newComp = cs.defineComponent({ is: 'base/comp' })
    expect(cs.getBehaviorByUrl('base/beh', '')).toBe(newBeh)
    expect(cs.getComponentByUrl('base/comp', '')).toBe(newComp)
    cs.updateBaseSpace(baseCs)
    expect(cs.getBehaviorByUrl('base/beh', '')).toBe(newBeh)
    expect(cs.getComponentByUrl('base/comp', '')).toBe(newComp)
    expect(cs.getBehaviorByUrl('base/beh2', '')).toBe(baseBeh2)
    expect(cs.getComponentByUrl('base/comp2', '')).toBe(baseComp2)
  })

  test('share style scope manager', () => {
    const cs1 = new glassEasel.ComponentSpace()
    const cs2 = new glassEasel.ComponentSpace(undefined, undefined, cs1.styleScopeManager)
    const scope1 = cs1.styleScopeManager.register('a')
    const scope2 = cs2.styleScopeManager.register('b')
    expect(cs1.styleScopeManager).toBe(cs2.styleScopeManager)
    expect(scope1 === scope2).toBe(false)
    expect(cs2.styleScopeManager.queryName(scope1)).toBe('a')
    expect(cs1.styleScopeManager.queryName(scope2)).toBe('b')
  })

  test('import space (public use)', () => {
    const mainCs = new glassEasel.ComponentSpace()
    const mainComp = mainCs.defineComponent({ is: 'main/comp' })
    const mainBeh = mainCs.defineBehavior({ is: 'main/beh' })
    const extraCs = new glassEasel.ComponentSpace()
    const extraComp1 = extraCs.defineComponent({ is: 'inner/comp1' })
    const extraBeh1 = extraCs.defineBehavior({ is: 'inner/beh1' })
    extraCs.exportComponent('outer/comp1', 'inner/comp1')
    extraCs.exportBehavior('outer/beh1', 'inner/beh1')
    mainCs.importSpace('space://extra', extraCs, false)
    expect(mainCs.getComponentByUrlWithoutDefault('main/comp', '')).toBe(mainComp)
    expect(mainCs.getComponentByUrlWithoutDefault('outer/comp1', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space://extra/inner/comp1', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space://extra/outer/comp1', '')).toBe(extraComp1)
    expect(mainCs.getBehaviorByUrl('main/beh', '')).toBe(mainBeh)
    expect(mainCs.getBehaviorByUrl('outer/beh1', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space://extra/inner/beh1', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space://extra/outer/beh1', '')).toBe(extraBeh1)
    const extraComp2 = extraCs.defineComponent({ is: 'inner/comp2' })
    const extraBeh2 = extraCs.defineBehavior({ is: 'inner/beh2' })
    extraCs.exportComponent('outer/comp2', 'inner/comp2')
    extraCs.exportBehavior('outer/beh2', 'inner/beh2')
    expect(mainCs.getComponentByUrlWithoutDefault('outer/comp2', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space://extra/inner/comp2', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space://extra/outer/comp2', '')).toBe(extraComp2)
    expect(mainCs.getBehaviorByUrl('outer/beh2', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space://extra/inner/beh2', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space://extra/outer/beh2', '')).toBe(extraBeh2)
  })

  test('import space (private use)', () => {
    const mainCs = new glassEasel.ComponentSpace()
    const mainComp = mainCs.defineComponent({ is: 'main/comp' })
    const mainBeh = mainCs.defineBehavior({ is: 'main/beh' })
    const extraCs = new glassEasel.ComponentSpace()
    const extraComp1 = extraCs.defineComponent({ is: 'inner/comp1' })
    const extraBeh1 = extraCs.defineBehavior({ is: 'inner/beh1' })
    extraCs.exportComponent('outer/comp1', 'inner/comp1')
    extraCs.exportBehavior('outer/beh1', 'inner/beh1')
    mainCs.importSpace('space://', extraCs, true)
    expect(mainCs.getComponentByUrlWithoutDefault('main/comp', '')).toBe(mainComp)
    expect(mainCs.getComponentByUrlWithoutDefault('inner/comp1', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space:///inner/comp1', '')).toBe(extraComp1)
    expect(mainCs.getComponentByUrlWithoutDefault('space:///outer/comp1', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('main/beh', '')).toBe(mainBeh)
    expect(mainCs.getBehaviorByUrl('inner/beh1', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space:///inner/beh1', '')).toBe(extraBeh1)
    expect(mainCs.getBehaviorByUrl('space:///outer/beh1', '')).toBe(null)
    const extraComp2 = extraCs.defineComponent({ is: 'inner/comp2' })
    const extraBeh2 = extraCs.defineBehavior({ is: 'inner/beh2' })
    extraCs.exportComponent('outer/comp2', 'inner/comp2')
    extraCs.exportBehavior('outer/beh2', 'inner/beh2')
    expect(mainCs.getComponentByUrlWithoutDefault('inner/comp2', '')).toBe(null)
    expect(mainCs.getComponentByUrlWithoutDefault('space:///inner/comp2', '')).toBe(extraComp2)
    expect(mainCs.getComponentByUrlWithoutDefault('space:///outer/comp2', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('inner/beh2', '')).toBe(null)
    expect(mainCs.getBehaviorByUrl('space:///inner/beh2', '')).toBe(extraBeh2)
    expect(mainCs.getBehaviorByUrl('space:///outer/beh2', '')).toBe(null)
  })

  test('import space (tricky URLs)', () => {
    const mainCs = new glassEasel.ComponentSpace()
    const extraCs = new glassEasel.ComponentSpace()
    const extraComp = extraCs.defineComponent({ is: 'comp' })
    mainCs.importSpace('space://', extraCs, true)
    expect(mainCs.getComponentByUrlWithoutDefault('space://comp', '')).toBe(extraComp)
  })

  test('create component with URL params (without generics)', () => {
    const cs = new glassEasel.ComponentSpace()
    const compDef = cs.defineComponent({
      is: 'comp/path',
      properties: {
        propA: {
          type: String,
          value: 'init',
        },
        propB: Number,
        propC: Boolean,
      },
      data: {
        dataD: 456,
      },
    })
    const comp = cs.createComponentByUrl(
      'root',
      '/comp/path?propC=1&propA&propB=3.4&dataD=789',
      null,
      composedBackend,
    ).asInstanceOf(compDef)!
    expect(comp.data.propA).toBe('init')
    expect(comp.data.propB).toBe(3.4)
    expect(comp.data.propC).toBe(true)
    expect(comp.data.dataD).toBe(456)
  })

  test('create component with URL params (with generics)', () => {
    const cs = new glassEasel.ComponentSpace()
    const childCompDef = cs.defineComponent({
      is: 'comp/child',
      properties: {
        pc: null,
      },
    })
    const compDef = cs.defineComponent({
      is: 'comp/parent',
      properties: {
        pp: Number,
      },
      generics: {
        ga: true,
        gb: {
          default: 'child',
        },
      },
      template: tmpl(`
        <ga id="a" pc="{{pp}}" />
        <gb id="b" pc="{{pp}}" />
      `),
    })
    const comp = cs.createComponentByUrl(
      'root',
      '/comp/parent?pp=123',
      {
        ga: 'comp/child',
      },
      composedBackend,
    ).asInstanceOf(compDef)!
    expect(comp.data.pp).toBe(123)
    const a = (comp.$.a as glassEasel.GeneralComponent).asInstanceOf(childCompDef)!
    const b = (comp.$.b as glassEasel.GeneralComponent).asInstanceOf(childCompDef)!
    expect(a.data.pc).toBe(123)
    expect(b.data.pc).toBe(123)
  })
})
