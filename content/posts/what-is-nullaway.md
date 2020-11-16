---
title: "[안드로이드] Nullaway 활용기"
date: "2018-09-21 00:27:36"
category: "Android"
template: "post"
draft: false
description: "한번도 NullPointerException (이하 NPE)를 겪어보지 않은 사람은 있을지 몰라도, 한번만 NPE 를 겪어본 사람은 없을것이다."
tags: 
  - Java
  - Library
redirect_from:
  - /2018/09/21/what-is-nullaway/
---

한번도 **NullPointerException** (이하 NPE)를 겪어보지 않은 사람은 있을지 몰라도, 한번만 NPE 를 겪어본 사람은 없을것이다. NPE 로 인한 크래시가 나기 전까지는 그 존재를 알 수 없기 때문에 항상 Null 값 처리를 신경 쓰면서 개발을 진행해야 한다. 잊을만하면 나타나는 NPE를 바라보면서 한숨을 쉬고 있을 때쯤, 동료 개발자에게 미리 NPE 예방에 도움을 주는 [Nullaway](https://github.com/uber/NullAway) 라이브러리를 소개받았다.

Nullaway 는 @Nullable 어노테이션을 이용하여 **Compile Time 에 Null check** 검사를 수행한다. 간결하고, 강력해보인다.
# Nullaway 세팅하기

`gradle` 기반으로 가이드가 되어있고, Android / Non - Android 방식으로 나뉘는데 거의 차이가 없다. 이 글에서는 Android 방식을 기준으로 설명한다.

App 모듈 Gradle 파일에 다음과 같이 추가해주면 설정이 끝난다.
```groovy
    apply plugin: 'net.ltgt.errorprone'
    
    buildscript {
      repositories {
        maven {
          url "https://plugins.gradle.org/m2/"
        }
      }
      dependencies {
        classpath "net.ltgt.gradle:gradle-errorprone-plugin:0.0.13"
      }
    }
    
    dependencies {
      ~~~
      annotationProcessor "com.uber.nullaway:nullaway:0.4.6"
      errorprone "com.google.errorprone:error_prone_core:2.1.3"
      ~~~
    }
    
    tasks.withType(JavaCompile) {
      if (!name.toLowerCase().contains("test")) {
        options.compilerArgs += [
            "-Xep:NullAway:ERROR",
            "-XepOpt:NullAway:AnnotatedPackages=com.your.package"]
      }
    }
```


다른 부분은 그대로 사용해도 상관없지만 해당 부분은 각 프로젝트에 맞게 수정을 해줘야 한다. Nullaway의 적용범위를 설정할 수 있다.

필수로 추가해줘야 하는 부분은 `-XepOpt:NullAway:AnnotatedPackages` 옵션이다. 해당 옵션값은 Nullaway 가 검사할 패키지를 지정한다. 위 옵션값으로 지정된 패키지 및 그 하위 패키지는 Nullaway가 요구하는 @Nullable 어노테이션 처리가 모두 되어있다고 가정하며, 만약 처리가 안되어 있을 경우 빌드시 에러를 발생시킨다.

그외에 자주 쓰이는 옵션은 다음과 같다.

- `-XepOpt:NullAway:UnannotatedSubPackages` : Nullaway가 요구하는 어노테이션 처리가 안되어 있는 패키지를 지정한다. 해당 패키지 및 그 하위패키지는 Nullaway 검사에서 제외된다.
- `-XepOpt:NullAway:ExcludedClasses` : Nullaway가 요구하는 어노테이션 처리가 안되어 있는 클래스를 지정한다. 해당 클래스는 Nullaway 검사에서 제외된다.

## 2개 이상의 패키지 혹은 클래스를 옵션값으로 주고 싶을 경우

같은 옵션의 값을 여러번 추가하면 될 거 같지만, 실제로는 가장 마지막에 추가된 값만 옵션에 적용되기 때문에 원하지 않는 결과가 나올 수 있다. 따라서 2개 이상의 클래스 / 패키지를 지정하고 싶을 경우에는 정규식을 이용해야 한다.

*com.project* 의 하위 패키지인 *foo*, *bar* 패키지를 Nullaway 검사에서 제외시키고 싶을 때

- `"-XepOpt:NullAway:UnannotatedSubPackages=com.project.(foo|bar)"`

prefix로 **test_** 가 붙은 패키지들을 Nullaway 검사에서 제외시키고 싶을 때

- `"-XepOpt:NullAway:UnannotatedSubPackages=com.project.test_[a-zA-Z0-9.]*"`

그외 자세한 설명은 [Docs](https://github.com/uber/NullAway/wiki/Configuration) 를 참고!

# 사용 방법

Android Support Library 에서 제공하는 `@Nullable` 어노테이션을 이용한다. Null 이 될 수 있는 필드, Null을 리턴할 수 있는 메소드에 `@Nullable`, Null 이 될 수 없는 필드, Null 을 리턴하지 않는 메소드는 `@NonNull` 을 추가해주면 된다. 아무런 어노테이션도 추가되지 않은 변수, 메소드는 @NonNull 로 인식한다. @Nullable 이 추가되어있는 필드는 항상 Null safe 체크 이후에 사용될 수 있고, @NonNull 이 추가되어 있는 필드는 Null 값이 들어올 수 없다는 것을 기본전제로 Null check 검사를 수행한다.

예제  
아래 코드를 빌드할 경우 NonNull 타입 파라미터에 Null 이 들어갔으므로 Nullaway가 에러를 낸다.
```java
    public void testModel(Model model) {
        Log.e("TEST", model.isValid());
    }
    
    public void call() {
        testModel(null);
    }
```

따라서 다음과 같이 처리해줘야 한다.
```java
    public void testModel(@Nullable Model model) {
        if (model != null) {
        	Log.e("TEST", model.isValid());
        }
    }
```
    

만약 Null check 없이 그대로 model 을 사용하려고 할 경우, 역시 에러를 낸다.

Nullaway가 에러를 띄워주는 케이스는 [Error Messages](https://github.com/uber/NullAway/wiki/Error-Messages) 에 정리되어 있다.
# 실제 프로젝트에 적용해보면서 느낀 점

1. 방어코드를 잘 추가했다고 생각했음에도 처리되지 않았던 부분이 많았고, 관련 코드를 모두 수정하여 앱의 안정성을 올리는데 도움을 주었다.
2. Nullaway 소개글에 나온 것 처럼 처리 속도가 빨라 빌드시간이 추가로 더 늘어나지는 않음.
3. 코드를 작성할 때 Nullable, NonNull 을 고려하게 된다는 점이 좋았음.

코틀린으로 넘어가게 되면 사용하지 않아도 무방하고 자바로 계속 개발할 경우 한번 적용해보는 것을 추천한다.

샘플 링크 [https://github.com/vagabond95/NullAwaySample](https://github.com/vagabond95/NullAwaySample)