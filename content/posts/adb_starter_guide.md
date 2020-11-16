---
title: "[Android] adb 기본 가이드"
date: 2020-08-16 21:49:19
category: "android"
template: "post"
description: "대부분의 디버깅 작업은 안드로이드 스튜디오 내부 디버거와 프로파일러를 이용하면 진행이 가능하기 때문에 adb 의 필요성을 크게 느끼지 못했다."
tags: 
    - adb
    - 디버깅
---
![cover](/media/cover/adb_starter_guide.jpg)
대부분의 디버깅 작업은 안드로이드 스튜디오 내부 디버거와 프로파일러를 이용하면 진행이 가능하기 때문에 adb 의 필요성을 크게 느끼지 못했다. 그런데 간혹 스튜디오 도구만으로는 해결이 어렵거나 애매한 케이스들을 맞이할 상황이 생겼고, 깊게 파보다 보니 adb 를 이용해 디버깅 할 수 있다는 사실을 알게 되었다.

사실 같은 작업을 수행한다면 커맨드 라인보다 GUI 를 선호해서 그런지 adb 와 그리 친숙하지 않았는데, 공부하다보니 제법 유용한 기능이 많아서 이번 기회에 간단히 정리를 했다.

# 시작하기 전에

adb 를 이용하기 전에 2가지 작업이 선행되어야 한다.

**1. 환경변수 설정**

adb 명령을 편하게 사용하기 위해서는 환경변수 설정이 필수다. MAC/window 별 설정 방법은 이미 자세히 설명되어있는 글들이 많으므로 생략한다.

**2. USB 디버깅 허용**

개발자 옵션 - USB 디버깅 항목에 대해 on 을 해줘야 adb - 기기간 통신이 가능해진다.

# 기본

가장 많이 사용했던 명령어 및 상황을 정리해봤다.

## 디바이스 조회

```bash
> adb devices [-l]
```

위 명령은 adb 서버에 연결된 디바이스의 시리얼 넘버와 상태를 차례로 출력한다.

상태는 아래와 같은 케이스가 있다.

- **device** : 정상적으로 연결되어 있다. 하지만 시스템이 부팅되는동안 adb 에 연결이 되기 때문에 시스템 부팅이 완료되었다고 보장하는 상태는 아니다.
- **no device** : 연결되어있는 디바이스가 없다.
- **offline** : 기기가 adb 에 연결되어 있지 않다. usb 선에 문제가 있는지 살펴보자.
- **unauthorized** : USB 디버깅이 허용되지 않은 기기이다.

### 특정 디바이스에 명령을 해야할 때

연결되어있는 디바이스가 1개라면 별도 옵션 추가 없이 adb 명령어를 사용할 수 있다. 그러나 연결된 디바이스가 2개이상일 경우, 이전에 사용한 명령어를 입력하면 어느 기기를 기준으로 adb 명령이 수행되어야 하는 알 수 없기 때문에 아래와 같은 에러가 발생한다.

> "more than one device/emulator"

옵션과 시리얼 넘버를 이용하여 해결이 가능하다.

```bash
// 연결된 디바이스 정보 확인
> adb devices
List of devices attached
SM1234            device
emulator-1234     device

// -s 옵션, 특정 디바이스 를 지정한 후 명령어 수행
> adb -s SM1234 shell $command

// -d 옵션, 연결된 하드웨어 디바이스가 1개라면 자동 지정 후 명령어 수행
> adb -d shell $command

// -e 옵션, 연결된 에뮬레이터 디바이스가 1개라면 자동 지정 후 명령어 수행
> adb -e shell $command
```

## adb 초기화

```bash
> adb kill-server
```

adb 서버 프로세를 kill 한다. adb 가 먹통일 때 주로 사용한다. 어떤 adb 명령어든 다시 입력하면 서버가 재시작한다.

## 기기에/기기에서 파일 복사

```bash
// 디바이스에서 개발 머신으로 파일 복사
> adb pull $devicePath $macihnePath

// 개발 머신에서 디바이스로 파일 복사
> adb push $machinePath $devicePath
```

디바이스의 host 파일을 변경할 때 유용하게 활용했다.

# dumpsys

adb 는 shell 명령어로 직접 기기를 제어하거나 기기정보를 가져올 수 있다. dumpsys 명령은 연결된 기기의 시스템 서비스 정보를 가져올 수 있다. 가장 기본적인 명령어를 입력하면 너무 방대한 정보가 한꺼번에 출력되기 때문에 다양한 옵션과 grep 을 적절히 활용하여 필요한 정보만 꺼내보는 지혜가 필요하다. 직접 활용하고 있는 몇가지 케이스에 대해서만 다룰예정이다.

## Acitivty stack 출력하기

Activity stack 이 깊고 복잡할수록 디버깅이 힘들어진다. adb 의 존재를 알기 전에는 스택의 구성을 알아내기 위해 하나하나 백버튼을 눌러봤던 기억이 있다. 

activity stack 을 볼 수 있는 기본 명령은 다음과 같다.

```bash
> adb shell dumpsys activity activities
```

그런데 위 명령은 현재 디바이스에서 활성화되어있는 모든 앱에대한 Acitivty 정보를 가져오기 때문에 필요한 정보를 금방 파악하기 어렵다. 

우리가 알고 싶은 것은 특정 앱에 대한 Activity stack 이므로 필터링이 필요하다.

```bash
> adb shell dumpsys activity activities | grep -i $packageName | grep -i Hist
```

명령어의 결과는 다음과 같다.

```bash
* Hist #1: ActivityRecord{692b031 u0 com.android.settings/.SubSettings t630}
* Hist #0: ActivityRecord{8e296f3 u0 com.android.settings/.homepage.SettingsHomepageActivity t630}
```

Hist (History) 의 숫자가 낮을수록 stack 에 먼저 추가된 Activity 이다. Hist 숫자가 가장 큰 Activity 가 현재 화면상에 나타나는 Activity 이므로, 현재 화면의 Activity 이름을 찾을때도 유용하게 활용할 수 있다.

## Doze, 앱 대기 모드 테스트

간혹 Doze 모드, 앱 대기 모드로 인한 이슈를 확인해야할 상황이 생긴다. 문제는 각 조건을 충족하여 모드를 재현하는 것이 꽤나 수고스러운 일이라는 점이다. 이를 대비하여 adb 에서는 각 모드로 진입할 수 있는 명령어를 제공한다.

### Doze 모드 테스트

```bash
> adb shell dumpsys deviceidle force-idle // Doze 모드 돌입

// Doze 모드 테스트...

> adb shell dumpsys deviceidle unforce // Doze 모드 해제
> adb shell dumpsys battery reset // 배터리 상태 리셋
```

### 앱 대기 모드 테스트

```bash
// 앱 대기모드 활성화
> adb shell dumpsys battery unplug
> adb shell am set-inactive $packageName true

// 앱 대기모드 해제
> adb shell am set-inactive $packageName false
> adb shell am get-inactive $packageName
```

# am (activity manager)

am 은 각종 컴포넌트 수행, 화면 속성 수정 등 다양한 시스템 작업을 수행하는 명령어이다.

## Activity 시작

am start 명령은 지정된 intent 정보를 기반으로 activity 를 실행한다. 옵션을 이용하여 인텐트 구성에 필요한 정보를 추가할 수 있다. [IntentSpec](https://developer.android.com/studio/command-line/adb?hl=ko#IntentSpec)

### 앱 내 Activity 로드

```bash
> adb shell am start -n $packageName/$activityName
```

**-n** 옵션은 패키지 정보를 기반으로 명시적 인텐트를 생성한다. 이때 activityName 은 클래스 이름이 아닌 manifest 에 등록된 **android:name** 값 이다. 또한 위 명령어로 실행할 수 있는 Activity 는 **android:exported** 옵션이 true 인 Activity 만 가능하다. 
아마 보안상 대부분의 Activity 는 exported 가 false 일 것 이므로 유용한 상황은 많이 없다. Intent filter 가 걸려있는 Activity 는 exported 를 true 로 유지해야 하므로 실행이 가능하나 intent filter 특성상 추가로 데이터를 넘기지 않으면 원하는 동작을 확인하기는 어려울 것이다.

### 커스텀 스킴 테스트

```bash
> adb shell am start -a android.intent.action.VIEW $customScheme://$path
```

**-a** 옵션은 Intent 의 Action 을 지정한다. 커스텀 스킴을 지정한 인텐트 필터를 설정 후 테스트 할때 유용하다. 

# 그외..

자주 활용하는 명령어를 위주로 정리 해봤다. 이 외에도 adb 로 할 수 있는 일은 무궁무진하다. 다만 모든 명령어를 다 외우는 것은 큰 의미가 없고, 어떠한 제어가 가능한지 인지하고 있다가 필요할 때 찾아서 쓰고 정리하면 충분하다고 생각된다.