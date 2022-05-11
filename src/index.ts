//这个文件充当vue模块
import "./mini-core"
import * as runtimeDom from "./runtime-dom"
import {registerRuntimeCompiler} from "./runtime-dom"

import {baseCompile} from "./compiler-core/src"
export * from "./reactivity/src"
export * from "./runtime-dom"

function compileToFunction(template,options={}){
    const {code}=baseCompile(template,options)

    // 调用compile 得到的代码在给封装到函数内
    // 这里会依赖runtimeDom 的一些函数，所以在这里通过参数的形式注入进去
    const render=new Function("Vue",code)(runtimeDom)

    return render
}