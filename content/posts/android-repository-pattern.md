---
title: "[안드로이드] Repository 패턴에 대한 고찰"
date: 2020-05-24 15:22:30
category: "android"
template: "post"
description: "공식문서에서도 가이드 하는 것 처럼 이제 Android 아키텍처를 구성할 때 Repository 패턴은 기본적으로 사용 되고있다."
tags: 
    - 아키텍쳐
redirect_from:
  - /2020/05/24/android_repository_pattern/
---
[공식 문서](https://developer.android.com/jetpack/docs/guide?hl=ko#overview)에서도 가이드 하는 것 처럼 이제 Android 아키텍처를 구성할 때 Repository 패턴은 기본적으로 사용 되고있다. 오늘은 Repository 패턴에 대한 간단한 정리와 사용하면서 내가 놓치고 있었던 점에 대하여 정리 해보려한다.

# TL;DR

- Repository 패턴의 궁극적인 목적은 결국 관심사의 분리다.
- DataSource 외에 data 에 대한 분리도 필요하다.

# Repository 패턴을 사용하는 이유

> Repositories are classes or components that encapsulate the logic required to access data sources.

Repository 는 DataSource 를 캡슐화 한다. 이점은 다음과 같다.

- 도메인과 연관된 모델을 가져오기 위해 필요한 DataSource 가 무엇인지 Presenter 계층에서는 알 필요가 없다.
    - 따라서 DataSource 를 새롭게 추가하는 것도 부담이 없다.
- DataSource 의 변경이 발생하더라도 다른 계층은 영향받지 않는다.
- client 는 repository 인터페이스에 의존하기 때문에 테스트 하기 용이하다.

결국 repository 는 Presenter 계층과 data 계층의 coupling 을 느슨하게 만들어준다.

# 구조

Andorid 진영에서는 아래 구조를 크게 벗어나지 않는다.

> View → Presenter / ViewModel → **Repository** → DataSource (API, Local DB)
![repository](//media/post/repository_pattern/repo1.png)

간단한 형태로 구현된 예시는 다음과 같다.

### ViewModel
```java
public class UserInformationViewModel {

		...

    public void onClickUserInfoButton(int userId) {
        mUserRepository.getUser(userId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                        user -> {
                            ///
                        },
                        error -> {

                        }
                );
    }
}
```

### Repository
```java
public class UserRepository {

		...

    public Single<User> getUser(int userId) {
        return userApi.getUser(userId);
    }
}
```

# 놓치고 있었던 점

Repository 패턴 자체는 적용이 어렵지 않다. 하지만 많은 사람들이 놓치고 있는 부분이 있는데, 위 예시에서도 찾을 수 있다.

바로 **Repository 가 DataSource 의 데이터를 그대로 전달**해준다는 점이다.

위 예시를 다시한번 살펴보자. UserRepository 는 UserApi 로 부터 전달받은 User 를 별다른 처리없이 그대로 리턴하고 이를 presentation layer 에서 사용하고 있다.

이것은 다음과 같은 문제점을 가지고 있다.

- back 단의 구현 이슈가 presentation layer 에 영향을 끼칠 수 있다.
- User 는 서버 (혹은 로컬 DB) 의 데이터베이스 테이블을 표현하는 역할을 수행하는 객체일 뿐이다.

## Data 스펙이 바뀌면 presentation layer 전반에 영향 끼치게 된다.

필드 삭제, 필드 이름 변경 등 서버가 데이터 구조를 변경하게 되면 이를 바로 참조하고 있는 다른 layer 에서도 필연적으로 변경이 발생하게 된다. 

예를 들어 클라쪽에서는 User 정보를 표기해야 하는데 서버에서 각기 다른 데이터의 요청을 N 번 거쳐야 한다고 생각해보자. 그럼 N 개의 데이터에 대한 변경 사항은 모두 온전히 클라에 영향을 줄 것이다. 더 중요한 점은 이렇게 복잡한 데이터 모델을 혼재하여 사용하게 되면 다른 개발자가 컨텍스트를 이해하기 매우 어려워지기 시작한다.

## 서버 (혹은 로컬 DB) 의 데이터베이스 테이블을 표현하는 역할을 수행하는 객체일 뿐이다.

같은 도메인에 대하여 클라와 서버의 용어가 통일이 되는 것이 가장 이상적이겠지만 현실세계에서는 서로 다른 용어를 사용하는 경우가 허다하다. 그럴 경우 보통은 클라이언트 코드 베이스에서 라도 서로 통일이 이루어져야 한다. 그런데 서버 데이터 구조를 그대로 가져와 사용할 경우, 팀내 도메인 용어와 실제 코드 베이스의 용어가 달라지게 되고 커뮤니케이션 리소스가 급증하게 되는 상황이 발생한다.

또한 도메인의 비즈니스 로직 처리에 필요한 메소드를 생성할 시점이 왔을 때, (서버 테이블을 반영한) 객체에 추가하게 되면 해당 객체는 테이블도 표현하고, 도메인 로직도 처리하는 [God object](https://en.wikipedia.org/wiki/God_object) 가 될 확률이 높다.

### 한번쯤 만들어 봤을 법한 클래스..
```java
public class User {
                
    @SerializedName("id")               
    private String id;                
    @SerializedName("nickname")               
    private String nickname;
    @SerializedName("grade")               
    private String grade;

    public boolean isManager() {
        return Grade.MANAGER == Grade.find(grade);
    }
}
```

Repository 패턴을 사용하는 목적은 data layer 와의 coupling 을 느슨하게 하는 것인데, 다시 강한 결합이 되어버린 꼴이 되었다.

## Mapper 를 활용하자

이러한 문제점을 해결하기 위하여 Mapper 를 사용할 수 있다. Mapper 란 말 그대로 테이블 객체 ↔ 도메인 모델 객체간의 mapping 을 시켜주는 유틸성 클래스를 의미한다. repository 내에서 mapper 를 활용하여 테이블 객체가 아닌 도메인 모델로 전달을 해주면 presentation layer 는 data layer 로 부터 진정한 자유를 찾을 수 있게 된다.
**Repository**
```java
public class UserRepository {

		...

    public Single<UserDomain> getUser(int userId) {
        return userApi.getUser(userId).map(UserMapper::fromTable);
    }
}
```
**Mapper**
```java
public class UserMapper {

    public static UserDomain fromTable(User user) {
        return new UserDomain(user.id, user.name, user.grade);
    }
}
```

만약 모든 모델에 대하여 보일러 플레이트 코드 처럼 Mapper 클래스를 만드는 것이 싫다면 [라이브러리](https://github.com/modelmapper/modelmapper) 를 활용해보는 것도 좋은 대안이다.

# 결론

다양한 아키텍처, 패턴을 공부하다 보면 결국 변경하기 쉬운 구조를 만들기 위한 여러 시도들이라고 생각된다. 단순히 패턴의 단면만을 보고 큰 고민없이 사용하는 것이 아니라 그속에 담겨있는 핵심을 잘 이해하고 사용하는 것이 중요하다는 것을 다시금 깨닫게 된다.

## Ref :

* https://academy.realm.io/kr/posts/clean-architecture-in-android

* https://proandroiddev.com/the-real-repository-pattern-in-android-efba8662b754

* https://medium.com/corebuild-software/android-repository-pattern-using-rx-room-bac6c65d7385

* https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design

* https://medium.com/@soleilstudio/object-mapping-in-android-f56935917c61
