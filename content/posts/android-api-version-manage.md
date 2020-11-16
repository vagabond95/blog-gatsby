---
title: "[Android] targetSdkVersion, compileSdkVersion, minSdkVersion 이란 무엇인가?"
date: 2019-09-20 18:35:05
category: "Android"
template: "post"
description: "프로젝트를 새롭게 세팅 할 때 기본적으로 다음 세가지 값을 기본적으로 지정하곤 한다. 세팅 이후에는 크게 건드릴 일이 없기에 평소에는 크게 신경쓰이지 않는 값이다. "
redirect_from:
  - /2019/09/20/android-api-version-manage/
---
프로젝트를 새롭게 세팅 할 때 기본적으로 다음 세가지 값을 기본적으로 지정하곤 한다. 세팅 이후에는 크게 건드릴 일이 없기에 평소에는 크게 신경쓰이지 않는 값이다. 
* targetSdkVersion 
* compileSdkVersion 
* minSdkVersion 

그런데... [새로운 Google Play 방침](https://developers-kr.googleblog.com/2018/01/improving-app-security-and-performance-on-google-play.html) 에 따르면  **play store 에 등록되어 있는 앱을 업데이트 하거나, 새로 앱을 등록 할 경우 정해진 `targetSdkVersion` 을 만족해야 한다.** 평소에 어렴풋하게 의미를 알고 있었는데 항상 헷갈려서 이번 기회에 정리 해보기로 했다.

targetSdkVersion 뿐만 아니라 compileSdkVersion, minSdkVersion  모두 **안드로이드 API 버전**과 관련된 값이므로 묶어서 한번에 다룰 예정이다.

---

# targetSdkVersion

**앱이 기기에서 동작할 때 사용되는 Android API 버전을 의미한다. (런타임)** 따라서 실제 앱 동작에 영향을 주게 되므로 신중히 올려야 한다. 이때 기기의 Android OS API 버전과 혼동하여 헷갈리기 쉬우므로 각 케이스별로 분리하여 살펴보자.

앱은 기본적으로 targetSdkVersion 에 명시된 API 버전을 기준으로 동작한다. 예외적으로 기기 OS 버전이 낮아 아직 targetSdkVersion 의 API 버전을 지원하지 않을 경우 기기 OS 버전을 따라간다.

### 1.  OS version > targetSdkVersion

- 기기의 OS 버전 : API 26
- 앱의 targetSdkVersion : API 24

해당 기기는 안드로이드 API 26 에서 제공하는 기능을 **모두 사용할 수 있는** 기기이다. 여기서 포인트는 사용할 수 있다는 것이지, 항상 해당 버전의 기능만 사용한다는 의미가 아니라는 것이다. 

위 사례처럼 앱이 targetSdkVersion 값을 24 로 정했을 경우, 기기는 API 26 버전에서 제공하는 기능을 사용할 수 있지만 앱은 API 24 베이스로 동작한다.

### 2. OS version == targetSdkVersion

- 기기의 OS 버전 : API 26
- 앱의 targetSdkVersion : API 26

이 경우는 os 와 target 이 동일하므로, 앱이 해당 기기에서 API 26 버전 베이스로 동작한다.

### 3.  OS version < targetSdkVersion

- 기기의 OS 버전 : API 26
- 앱의 targetSdkVersion : API 27

이 경우는 보통 국내 제조사들의 OS 업데이트가 늦기 때문에 발생될 수 있는 상황이다.

앱은 기기의 OS 버전인 API 26 베이스로 동작한다. 

---

# compileSdkVersion

**컴파일 시 사용되는 Android API 버전을 의미한다. (컴파일 타임)** 따라서 실제 개발중 사용할 수 있는 android API 범위는 compileSdkVersion 에 의해 결정된다. compileSdkVersion  값은 가급적 최신으로 유지하기를 권장하는데, targetSdkVersion 을 변경하지 않는 한 실제 배포되는 앱에 대한 사이드 이펙트가 없기 때문이다.

보통 최신 API 가 나오면 compileSdkVersion 을 먼저 올려서, 최신 API에 대한 대응이 완료된 후 targetSdkVersion 을 올린다. 만약 최신 버전 API 에서 새로 생긴 기능이 있고 이를 추가할 경우 warning 을 통해 하위 버전에서는 작동하지 않으므로 분기 처리를 요구한다.

추가로 gradle 내에 buildToolVersion 값이 있는데, 정상적인 빌드를 위해 complieSdkVersion 을 올릴 때 같이 최신버전으로 맞춰주는 것을 권장한다.

---

# 잠깐, 버전이 분할 되어 관리되어야 하는 이유는?

왜 안드로이드는 이렇게 각각 별도의 버전 정책을 둔 것일까? 

이유를 유추해보면 다음과 같다. API 버전이 올라가면 Deprecated 되거나, 새롭게 추가된 것이 존재할 것이다. 이때 기기 os 버전을 기준으로 앱이 실행되도록 하면, 해당 버전이 대응이 안되어있던 앱들은 전부다 의도하지 않은 동작이 발생할 수 있다. 따라서 **개발자들에게 앱이 컴파일타임과 런타임에 영향받는 API 버전을 각각 관리할 수 있도록 하여 위와 같은 문제를 예방**하도록 하도록 한다.

최근에는 google 에서 많은 앱들이 targetSdkVersion 을 올리지 않아, 자신들이 의도한만큼 업데이트가 잘 반영되지 않고 이에 따라 좋지않은 사례들이 나오고 있음을 깨달았다. (최신 API는 당연히 이전 버전에서 문제가 되었거나 개선되어야할 점을 반영한 것이기 때문에 이전 API 보다 좋을 수 밖에 없고 빠르게 적용해주는 것이 좋다.) 이에 대한 대책으로 2018년 8월 이후로 target 을 구글이 명시한 최신버전으로 맞추지 않으면 playstore 에 업로드 및 업데이트를 할 수 없는 정책을 추가했다.

새로운 API가 나왔지만 아직 대응하기 어려울 경우, target 을 올리지만 않으면 된다. 하지만 되도록 최신버전은 바로 대응해주는 것이 일정관리 및 정신건강에 이롭다고 느낀다.

---

# minSdkVersion

해당 앱을 구동할 수 있는 **최소 커트라인**이라고 이해하면 쉽다. 플랫폼의 OS 버전이 minSdkVersion 보다 낮을경우 앱이 설치되지 않는다.

---

# API 버전 분기 처리와 SupportLibrary

우리는 사용자의 플랫폼이 어떤 버전을 사용하는지 미리 알 수 없기 때문에 버전별 API 변경 사항에 맞게 사용할 수 있도록 분기 처리를 해주어야 한다. 

실제로 AndroidStudio 에서도 분기처리가 필요한 기능을 그냥 사용할 경우 warning 을 통해 알려주게 되는데 무시하고 진행해도 빌드는 정상적으로 되지만, 추후에 배포됐을 때 사용자 기기의 OS 버전에 따라 크래시가 발생할 수 있다.

## 애증의 minSdkVersion

분기 처리를 해야하는 버전의 범위는 minSdkVersion 을 기준으로 체크한다. minSdkVersion 은 앱이 구동될 수 있는 최소 요구 버전이므로, minSdkVersion 이 낮을수록 개발 시 대응해야 하는 버전이 많고, 높을수록 대응해야 하는 버전이 적다. 다양한 버전 대응을 위한 분기 처리가 많아질 수록 관리포인트가 늘어나고, 가독성도 떨어지게 되어 점점 보기 싫어지는 코드가 된다..

특히 알림 기능(Notification) 의 경우 특정 버전 이상에서만 되는 기능들이 굉장히 많은데 이를 모두 분기 처리하다보면 실제 로직을 파악하기 쉽지 않다. 

개발자 입장에서는 minSdkVersion 값이 높을 수록 대응할 버전이 줄어드로 피로도가 적으므로, 앱의 minSdkVersion 이 높은 것이 회사 복지라는 우스갯소리도 있다. (우리도 조금만 더 올렸으면 좋겠다..)

그래도 보통 최대한 많은 고객에게 앱을 제공하기 위해 대부분 회사는 커버러지 99.8% ~ 99.9% 에 포함되는 버전까지는 대응하는 것으로 알고 있다.

## SupportLibrary

위에서 살펴본 것 처럼 하위 호환성을 유지하기 위한 분기문으로 인해, 점점 코드의 가독성이 떨어지는 상황을 필연적으로 맞이하게 된다. 안드로이드에서는 다음 문제를 해결하기 위해 [SupportLibrary](https://developer.android.com/topic/libraries/support-library) 라는 대안을 내놓게 되었다.

서포트 라이브러리는 내부적으로 버전에 대한 분기 처리가 되어있어, 별도의 추가 작업없이 바로 기능을 수행하는 코드를 작성하면 된다.