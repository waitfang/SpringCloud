package com.example.springboot.Aspect;

import java.lang.annotation.Retention;
import java.lang.annotation.Target;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.ElementType;

@Target(ElementType.METHOD)//字段注解 , 用于描述方法
@Retention(RetentionPolicy.RUNTIME)//在运行期保留注解信息  
public @interface UserAnnotation {
	
	String name() default "User";
}
