import {mutableHandlers,readonlyHandlers,shallowReadonlyHandlers} from "./baseHandlers"

export const reactiveMap=new WeakMap()
export const readonlyMap=new WeakMap()
export const shallowReadonlyMap=new WeakMap()

export const enum ReactiveFlags{
    IS_REACTIVE="__v_isReactive",
    IS_READONLY="__v_isReadonly",
    RAW="__v_raw"
}

export function reactive(target){
    return createReactiveObject(target,reactiveMap,mutableHandlers)
}
export function readonly(target){
    return createReactiveObject(target,readonlyMap,readonlyHandlers)
}

export function shallowReadonly(target){
    return createReactiveObject(
        target,
        shallowReadonlyMap,
        shallowReadonlyHandlers
    )
}

export function isProxy(value){
    return isReactive(value) || isReadonly(value)
}

export function isReadonly(value){
    return !!value[ReactiveFlags.IS_READONLY]
}

export function isReactive(value){
    // 如果value是proxy的话
    // 会触发get操作，而在createGetter里面会判断
    // 如果value是普通对象的话
    // 那么会返回undefined,那么就需要转换成布尔值
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function toRaw(value){
    // 如果value是proxy的话,那么直接返回就可以了
    // 因为会触发createGetter内的逻辑
    // 如果value是普通对象的话
    // 我们就应该返回普通对象
    // 只要不是proxy,只要是得到了undefined的话,那么就一定是普通对象
    // todo这里和源码里面实现的不一样,不确定后面会不会有问题
    if (!value[ReactiveFlags.RAW]) {
        return value
    }
    return value[ReactiveFlags.RAW]
}

function createReactiveObject(target,proxyMap,baseHandlers){
    // 核心就是proxy
    // 目的是可以侦听到用户get或者set的动作
    // 如果命中的话就直接返回就好了
    // 使用缓存做的优化点
    const existingProxy=proxyMap.get(target)
    if (existingProxy) {
        return existingProxy
    }
    const proxy=new Proxy(target,baseHandlers)
    // 把创建好的proxy存起来
    proxyMap.set(target,proxy)
    return proxy
}