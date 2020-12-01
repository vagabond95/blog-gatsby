---
title: "[Android] 패키지 구조에 대한 고찰"
date: 2020-12-02 02:01:41
category: "Android"
template: "post"
description: "프로젝트가 어느정도 규모에 도달하게 되면 패키지 구조에 대해 고민하게 되는 시기가 찾아온다. "
---
프로젝트가 어느정도 규모에 도달하게 되면 패키지 구조에 대해 고민하게 되는 시기가 찾아온다. 흔히 채택되는 패키지 종류는  도메인(기능) 중심, 레이어 중심으로 나뉘게 된다.

MVVM 을 채택한 프로젝트라고 가정하면 각 구조는 다음과 같다.

## 각 계층 구조

도메인 중심

```
 ├──   feature
    ├──   login
    │  ├──   LoginActivity.kt
    │  ├──   LoginItemAdapter.kt
    │  └──   LoginViewModel.kt
    └──   member
       ├──   MemberListActivity.kt
       ├──   MemberListAdpater.kt
       ├──   MemberListViewHolder.kt
       └──   MemberListViewModel.kt
```

레이어 중심

```
├──   activity
│   ├──   LoginActivity.kt
│   └──   MemberListActivity.kt
├──   adapter
│   └──   MemberListAdpater.kt
├──   viewholder
│   └──   MemberListViewHolder.kt
└──   viewmodel
    ├──   LoginViewModel.kt
    └──   MemberListViewModel.kt
```

## 최근에는 대부분 도메인 중심의 구조를 선호

나는 도메인 중심의 구조에 손을 들어주고 싶다. 최근에는 개발 영역을 불문하고 대부분 도메인 중심의 구조를 선호하는 것으로 보인다.

도메인 중심 구조가 레이어 중심 구조에 비해 가지는 장점은 다음과 같다.

### 연관된 코드를 쉽게 찾을 수 있다

트러블 슈팅을 하거나 변경이 필요할 때 연관된 클래스를 확인하려 할 때, 레이어 중심 패키지는 무엇이 연관된 클래스인지 한번에 파악이 어렵고 찾아가는 과정에서 가지고 있던 컨텍스트가 자주 깨진다. 도메인 중심 패키지는 이러한 어려움을 덜 겪을 수 있다.

### 높은 수준으로 추상화되어 전체적인 구조 파악이 쉽다

각 패키지는 기능을 추상화 하므로 어플리케이션이 어떠한 역할을 수행하고 있는지 쉽게 파악이 가능하다. 

### (자바 기준에서) 스코프를 최소화 할 수 있다.

레이어 중심 패키지에서는 default 접근 제한자를 사용할 수 없기에 캡슐화의 제약이 생길 수 있다.

## 실제 구조

하지만 실제 개발에서는 도메인의 비즈니스적인 부분 외에 모델이나 유틸리티와 같은 부분을 담는 부분이 추가로 필요하므로 다음과 같은 구조가 될 것 같다.

```
└──   com
    └──   cafe
        └──   mvvm
            ├──   feature
            │   ├──   common
            │   │   └──   CircleImageView.kt
            │   ├──   login
            │   │   ├──   LoginActivity.kt
            │   │   ├──   LoginItemAdapter.kt
            │   │   └──   LoginViewModel.kt
            │   └──   member
            │       ├──   MemberListActivity.kt
            │       ├──   MemberListAdpater.kt
            │       ├──   MemberListViewHolder.kt
            │       └──   MemberListViewModel.kt
            ├──   global
            │   ├──   Application.kt
            │   └──   Const.kt
            ├──   model
            │   ├──   db
            │   │   ├──   MemberDatabase.kt
            │   │   └──   dto
            │   │       └──   MemberProifleDto.kt
            │   └──   network
            │       ├──   RetrofitAdpater.kt
            │       ├──   RetrofitClient.kt
            │       ├──   api
            │       │   ├──   LoginApis.kt
            │       │   └──   MemberApis.kt
            │       └──   response
            │           └──   MemberResponse.kt
            └──   util
                ├──   FileParser.kt
                ├──   KeyboardUtils.kt
                └──   NetworkChecker.kt
```

### global

앱 전역에서 공통으로 사용되는 코드의 집합이다. Application 클래스나 전역 상수등이 들어갈 수 있다.

### feature

도메인 중심으로 각각 나뉜다. 각 도메인 패키지에는 MVVM 에서 View 와 ViewModel 에 해당하는 코드가 존재한다. 공통 영역은 common 으로 분리한다.

### model

Model 에 대한 내용으로 API 와 데이터 베이스와 연관된 코드가 존재한다.

### util

유틸성 코드의 집합이다. 도메인 로직과는 독립적이다.

## 고민해볼 점

1. 프로젝트가 커질수록 도메인 많아질텐데 모두 같은 level 에서 다룰 것인가? 만약 상위 레벨과 하위 레벨의 구분이 생긴다면 무엇을 기준으로 구분할 것인가?

    → 가정 처음 떠오르는  접근방식은 Activity stack 이 쌓일 수 있는 순서대로 계층 구조를 만드는 것이다. 이 방법은 어떤 기능이 어떤 패키지에 위치하는지 쉽게 유추가 가능하다. 하지만 프로젝트가 커질 수록 레벨 이 깊어질 수 있다. 

2. 공통으로 사용되는 화면은 어떤 패키지에 분류할 것인가?

    → 1번 내용이 먼저 정리되어야 자세한 규칙을 정할 수 있겠지만 가장 상위 레벨에 common 과 같은 패키지를 두는 것이 적절해보인다.