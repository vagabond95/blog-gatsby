---
title: "[안드로이드] API 26, Oreo Notification 대응기"
date: 2018-04-19 00:45:35
category: "Android"
template: "post"
draft: false
description: "안드로이드에서 제공하는 알림(Notification) 은 강력한 기능들을 제공하고 있다. 그리고 매번 API 버전이 올라갈 때마다 빈번하게 Update 가 되는 녀석이기 때문에 계속해서 주시하고 있어야하는 놈이기도 하다. 그동안 아무생각없이 copy & paste 만 하면서 사용하고 있던 스스로를 돌아보며 다시한번 알림의 전반적인 사용방법에 대해 정리하고자 포스트를 적었다."
tags: 
  - oreo

---
## **들어가며**

안드로이드에서 제공하는 알림(Notification) 은 강력한 기능들을 제공하고 있다. 그리고 매번 API 버전이 올라갈 때마다 빈번하게 Update 가 되는 녀석이기 때문에 계속해서 주시하고 있어야하는 놈이기도 하다. 그동안 아무생각없이 copy & paste 만 하면서 사용하고 있던 스스로를 돌아보며 다시한번 알림의 전반적인 사용방법에 대해 정리하고자 포스트를 적었다.

### **개발 환경**

- supportLibrary Version - 26.1.0
- complileSDK Version - 26
- targetSDK Version - 26

## **TL; DR**

오레오에서 알림 대응은 피할 수 없다. 미대응시 작동 X 😱

## **오레오대응.. 더이상은 피할 수 없다?**

아직 비교적 최신 버전인 오레오 대응을 굳이 처음부터 다르는 이유는 다음과 같다.

1. [새로운 Google Play 방침](https://developers-kr.googleblog.com/2018/01/improving-app-security-and-performance-on-google-play.html) 에 따르면 2018년 하반기 부터 play store 에 등록되어 있는 앱을 업데이트 하거나, 새로 앱을 등록 할 경우 `targetSdkVersion >= 26` 을 만족해야 한다. 따라서 오레오(8.0) 대응을 피할 수 없게 되었다.

2. 오레오 여러 변경 사항 중 특히 신경써줘야 할 부분은 알림(Notification) 에 대한 변경사항인데, 이를 반영하지 않을 경우 **알림이 오지않는 치명적인 상황이 발생한다.**

## **NotifcationChannel 의 등장**

우리가 처리해줘야하는 부분은 오레오에서 새롭게 등장한 [NotificationChannel](https://developer.android.com/training/notify-user/channels) 과 관련되어있다. 왜 google 은 이 녀석에 대한 처리를 강제했을까? 다음 상황을 살펴보면 그 이유를 짐작할 수 있다.

나는 스마트폰에 알림이 쌓여있는 걸 좋아하지 않아서, 보통 대부분 앱의 알림을 꺼놓는다. 하지만 그때 아쉬운 점이 하나 있었는데, 확인하고 싶은 일부 알림 역시 받을 수 없다는 것이었다.

Android 7.1 (API level 25) 이하 버전에서는 모든 알림이 하나로 묶여 관리됐기 때문에 위의 아쉬운 점을 해결할 수 없었고 이에 대한 대안으로 오레오에서 NotificationChannel 이 새롭게 추가되었다.

NotificationChannel 을 적용할 경우 더이상 각 알림이 하나로 묶이지 않고, channel 별로 분리되어 유저가 유연하게 알림을 설정할 수 있다. 위와 같이 notification_practice 앱에는 각각 `확인하고싶은 알림` 과 `보고싶지 않은 알림` 채널이 있으며 각 채널별로 수신여부, 잠금화면 표시여부, 소리 & 진동 설정 등 여러 옵션을 세밀하게 설정할 수 있다. 👏👏👏

## **NotificationChannel 적용하기**

적용과정은 다음과 같다.

1. NotifcationChannel 생성
2. NotificationManager 에 만들어둔 NotifcationChannel 을 등록
3. Notification builder 에 등록된 NotifcationChannel의 id 를 등록

### **NotificationChannel 생성 및 등록**
```java
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        String uniqueId = "uniqueId";
        String channelName = "확인하고 싶은 알림";
        String description = "확인하고 싶은 알림 채널입니다.";
        int importance = NotificationManager.IMPORTANCE_HIGH;
    
        NotificationChannel notificationChannel = new NotificationChannel(uniqueId, channelName, importance);
        notificationChannel.setDescription(description);
    
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        notificationManager.createNotificationChannel(notificationChannel);
      }
```

NotificationChannel 은 support library 에서 사용할 수 없다. 즉, 오레오 이전버전에서는 지원되지 않기 때문에 반드시 버전체크를 해줘야 한다.
NotificationChannel 을 생성할 때 요구되는 id, name, importance 그리고 description 에 대해 간략히 설명하면 다음과 같다.

- id : 각 채널을 구분할 수 있는 unique 한 값
- name : 유저에게 표시되는 채널 이름
- importance : 알림에 대한 중요도이며 이 값에 따라 알림의 동작이 달라진다. API 25 이하버전에서 사용되던 notification priority 개념과 동일. 각 importance 값에 따른 동작의 차이는 [importance level](https://developer.android.com/training/notify-user/channels#importance)에 잘 나와있다.
- description : 채널에 대한 설명, 특정 채널 설정 창에서 표기됨

### **Notification builder 생성 및 channel id 등록**
```java
    NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(context, channelId);
    
        notificationBuilder
            .setSmallIcon(iconResource)
            .setContentTitle(title)
            .setContentText(content)
            .setPriority(NotificationCompat.PRIORITY_HIGH);
    
        // 기존 빌더에 Channel을 추가할 경우
        notificationBuilder
            .setSmallIcon(iconResource)
            .setContentTitle(title)
            .setContentText(content)
            .setChannlId(channlId)
            .setPriority(NotificationCompat.PRIORITY_HIGH);
    
        // 알림 생성!
        NotificationManagerCompat.from(context).notify(++notificationId, notificationBuilder.build());
```

새롭게 알림 빌더를 구현할 경우 생성자에 channelId 를, 이미 사용하고 있는 빌더가 있다면 해당 빌더에 channel Id 를 추가해주면 된다. (내부 코드는 동일하다.)
setChannelId 을 이용하여 채널을 등록하는 방법을 택했을 때, API 25 이하 버전에서는 `null` 이 들어가겠지만 내부에서 무시되기 때문에 안심해도 된다.

## **Notification Channel Tips**

### **채널은 딱 한번만 생성해주면 된다.**

즉, 매번 알림을 만들때마다 채널을 다시 만들어줄 필요가 없다. 채널을 관리하는 유틸 클래스를 만들거나, application 클래스 등을 활용하여 재사용하는 방식으로 사용하면 된다.

### **채널 정보 변경하기**

이미 등록되어 있는 채널의 정보를 다시 바꿀 수 있을까? 가능하다! 하지만, 바꿀 수 있는 정보는 `name`, `description` 뿐이며, 그외의 채널정보를 바꾸고 싶을 경우 해당 채널을 삭제한 후 새로운 정보를 가지고 있는 채널을 다시 생성해줘야 한다.

- **등록된 채널의 name, description 을 변경하고 싶을 경우**

    NotificationChannel notificationChannel = new NotificationChannel(uniqueId, newChannelName, importance);
    notificationChannel.setDescription(newDescription);
    
    NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    notificationManager.createNotificationChannel(notificationChannel);

변경하고자 하는 name, description 을 가진 채널을 재등록해주면 된다. 이때 변경 전, 변경 후 채널 id가 동일한지 잘 확인하자.

- **등록된 채널을 삭제하고 싶을 경우**

    NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
    notificationManager.deleteNotificationChannel(channelId);

### **Sound 설정도 잊지말자**

- 기존에는 builder 상에서 sound 설정을 해줬지만, 오레오 부터는 알림이 채널별로 관리되므로 sound 설정도 각 채널 별로 해줘야 한다.

    AudioAttributes audioAttributes = new AudioAttributes.Builder()
              .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
              .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
              .build();
    
    notificationChannel.setSound(soundUri, audioAttributes);

- `setSound()` 메소드에는 2개의 인자가 들어가는데 첫번째, sound 는 기존에 사용하던 파일의 uri 를 넣어 주면된다. 두번째 **AudioAttributes** 가 이번에 새롭게 생긴 녀석인데, 위 코드와 같이 추가로 설정해주지 않으면 소리가 나오지 않는다.

## **추가로 알게된 사실들**

1. **priority 와 importance level 이 다를경우 무엇이 우선될까?**

    알림 빌더 생성시 API 25 이하 버전을 위해 priority 값을 반드시 설정해줘야 한다. 따라서 오레오(26) 이상의 버전은 importance 값과 priorty 값 모두 가지고 있게 되는데, 이때 (매우 드물겠지만) 각각의 값이 다를 경우 어떤 값을 따라갈까?

    - importance 는 IMPORTANCE_HIGH 설정 (가장 높은 기대값)
    - priority 는 PRIORITY_MIN 설정 (가장 낮은 기대 값)

    결과는 importance 를 따라감을 확인 했다.

2. **설정한 importance / priority 값이 항상 알림의 동작을 결정한다고 보장할 수 없다.**

    위의 importance 값에 대해 설명할 때 해당 값이 알림의 동작을 결정한다고 얘기했었다. 그런데 이제와서 보장할 수 없다니?

    docs 에서 이부분을 명확히 설명해주고 있다.

> Although you must set the notification importance/priority as shown here, the system does not guarantee the alert behavior you’ll get. In some cases the system might change the importance level based other factors, and the user can always redefine what the importance level is for a given channel

즉, 정리하면 importance / priority 값이 알림의 동작을 결정하는 것은 맞으나 `다양한 상황에서 해당 값이 바뀔 수 있으므로` 항상 설정해준 값대로 알림이 동작할 것이라고 판단하지 말라는 의미이다. 실제로 importance 값을 high 로 세팅한 channel 이 있어도 해당 channel 설정에서 중요도(importance) 값을 변경할 경우 high 가 아닌 가장 최근에 변경한 값으로 적용됨을 확인 할 수 있다. (사실 유저입장에서는 유저가 변경한 설정이 유지되는게 맞으므로 자연스러운 로직이다.)
