import {createDep} from "./dep"
import {extend} from "../../shared/index"

let activeEffect=void 0;
let shouldTrack=false;
const targetMap=new WeakMap()

// 用于依赖收集
export class ReactiveEffect{
    active=true;
    deps=[];
    public onStop?: ()=>void;
    constructor(public fn,public scheduler?){
        console.log("创建 ReactiveEffect 对象")
    }

    run(){
        console.log("run")
        // 运行run的时候，可以控制要不要执行后续收集依赖的一步
        // 目前来看的话，只要执行了fn那么就默认执行了收集依赖
        // 这里就需要控制了
        // 是不时收集依赖的变量
        // 执行fn但是不收集依赖
        if (!this.active) {
            return this.fn()
        }

        // 执行fn收集依赖
        // 可以开始收集依赖了
        shouldTrack=true
        // 执行的时候给全局的activeEffect赋值
        // 利用全局属性来获取当前的effect
        activeEffect=this as any
        // 执行用户传入的fn
        console.log("执行用户传入的fn")
        const result=this.fn()
        // 重置
        shouldTrack=false
        activeEffect=undefined
        return result;
    }
    stop(){
        if (this.active) {
            // 如果第一次执行stop后active就false了
            // 这是为了防止重复的调用,执行stop逻辑
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop()
            }
            this.active=false
        }
    }
}

function cleanupEffect(effect){
    // 找到所有依赖这个effect的响应式对象
    // 从这些响应式对象里面把effect给删除掉
    effect.deps.forEach((dep)=>{
        dep.delete(effect)
    })
    effect.deps.length=0;
}

export function effect(fn,options={}){
    const _effect=new ReactiveEffect(fn)

    // 把用户传过来的值合并到 _effect对象上去
    // 缺点就是不是显示的,看代码的时候并不知道有什么值
    extend(_effect,options)
    _effect.run()

    // 把_effect.run 这个方法返回
    // 让用户可以自行选择调用的时机(调用fn)
    const runner:any=_effect.run.bind(_effect)
    runner.effect=_effect
    return runner
}

export function stop(runner){
    runner.effect.stop()
}

export function track(target,type,key){
    if (!isTracking()) {
        return;
    }
    console.log(`触发track -> target:${target} type:${type} key:${key}`)

    // 1.先基于target找到对应的dep
    // 2.如果是第一次的话,那么就需要初始化
    let depsMap=targetMap.get(target)
    if (!depsMap) {
        // 初始化 depsMap 的逻辑
        depsMap=new Map()
        targetMap.set(target,depsMap)
    }

    let dep=depsMap.get(key)
    if (!dep) {
        dep=createDep()
        depsMap.set(key,dep)
    }
    trackEffects(dep)
}

export function trackEffects(dep){
    // dep 来存放所有的effect
    // todo
    // 这里是一个优化点
    // 先看看这个依赖是不是已经收集了
    // 已经收集的话,那么就不需要在收集一次了
    // 可能会影响code path change的情况
    // 需要每次都cleanupEffect
    // shouldTrack= !dep.has(activeEffect)
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        (activeEffect as any).deps.push(dep)
    }
}

export function trigger(target,type,key){
    // 1.先收集所有的dep放到deps里面
    // 后面会统一处理
    let deps:Array<any>=[]
    // dep
    const depsMap=targetMap.get(target)
    if(!depsMap) return;

    // 暂时只实现了get类型
    // get类型只需要取出来就可以
    const dep=depsMap.get(key)

    // 最后收集到deps内
    deps.push(dep)
    const effects:Array<any>=[]
    deps.forEach((dep)=>{
        // 这里解构dep 得到的是dep内部存储的effect
        effects.push(...dep)
    })
    // 这里的目的是只有一个dep,这个dep里面包含所有的effect
    // 这里的目前应该是为了triggerEffects这个函数的复用
    triggerEffects(createDep(effects))
}
export function isTracking(){
    return shouldTrack && activeEffect !==undefined
}

export function triggerEffects(dep){
    // 执行收集到的所有的effect的run方法
    for (const effect of dep) {
        if (effect.scheduler) {
            //  scheduler 可以让用户自己选择调用的时机
            // 这样就可以灵活的控制调用了
            // 在 runtime-core中,就是使用了 scheduler实现了在next ticker中调用的逻辑 
            effect.scheduler()
        }else{
            effect.run()
        }
    }
}


































