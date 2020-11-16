---
title: "[git] squash merge 된 branch 를 rebase 할 때 생기는 이슈 - onto 옵션의 활용"
date: 2019-11-03 18:12:30
category: "git"
template: "post"
description: "git rebase 이슈"
redirect_from:
  - /2019/11/03/git-rebase-onto/
---

# 문제 상황

**1.초기 브랜치 상황**
```
// master
A

// old_feature
A - B - C - D

// new_feature (dependent old feature)
A - B - C - D - E - F - G - H
```

**2. squash merge**

이후 old_feature 가 squash merge 로 master 에 반영되었다.
```
// master
A - X
```
**3. conflict 발생**

new_feature 작업이 마무리된 후, 변경된 master 를 기준으로 rebase 하여 PR 을 날리려고 시도하였다. 

**기대한 브랜치**
```
// new_feature (rebase from master)
A - X - E' - F' - G' - H'
```
그런데 conflict 가 발생하면서 old_feature 의 커밋 'A - D' 를 순차적으로 resolve 처리해야하는 상황이 발생했다. **master 의 커밋 X 에 이미 old feature 브랜치의 변경사항이 모두 반영되어 있는데** 왜 이런 일이 발생하는 것일까?
# 원인

원인을 알아보기 위해  Rebase 가 진행되는 과정을 살펴보도록 하자. 
```bash
> git rebase master
```
이렇게 아무런 옵션을 주지 않고 rebase 명령을 요청할 경우 다음과 같은 과정으로 진행된다.

1. 체크아웃 된 브랜치와 master 브랜치가 나뉘기 전인 공통의 조상 커밋으로 이동한다.
2. 공통 커밋부터 체크아웃 된 브랜치의 HEAD 까지 diff를 만든다.
3. 만들어진 diff 를 순차적으로 적용한다.

위 과정을 베이스로 conflict 가 난 상황을 다시 재현 해보자.

1. new_feature 를 master branch 를 통해 리베이스 한다.
2. master 와 new_feature 의 공통 커밋인 **A 로 이동한다**.
    - old_feature 와 new_feature 의 공통 커밋은 D 이지만, 스쿼시 옵션으로 인해 **old_feature 의 'B~D' 커밋이 X로 통합 되었으므로** 리베이스 과정에서는 D 를 찾을 수 없다.
3. A 부터 new_feature 의 HEAD 까지  순차적으로 diff 를 적용한다.
4. B,C,D 의 diff 를 반영할 때 **X 에는 B,C,D 의 내용이 이미 반영되어있으므로** 중복된 내용에 대해 다시conflict 가 발생하고 과정이 꼬이게 된다.

## 결론  
squash 로 인해 기존의 공통 커밋이 새로운 커밋으로 통합되어 사라지게 되면서, rebase 과정에서 conflict 가 발생  


# 해결

원인은 rebase 의 기본 동작을 수행했을 때 A 커밋부터 시작되는 것이었다. 그렇다면 old_feature 가 반영된 X 커밋의  이후 커밋부터 rebase 를 수행하도록 할 수 는 없을까?

다행히도 `rebase 에서는 --onto 옵션을 제공하여 rebase 가 동작할 커밋 범위를 지정`할 수 있다.
```bash
> git rebase --onto master HEAD~4
```
위와 같이 요청할 경우 rebase 는 HEAD 를 포함하여 최근 4개의 커밋 범위까지 rebase 를 수행한다. 즉, new_feature 기준으로 E - F - G - H 범위 내에서 rebase 가 수행된다. master 에는 E~H 에 대한 내용이 없으므로 conflict 발생없이 한줄로 예쁘게 rebase 가 완료된다.

**rebase 가 완료된 브랜치**
```
// new_feature
A - X - E' - F' - G' - H'
```
**번외**

커밋 범위를 지정하는 것이 번거로울 경우 아래와 같은 방법으로 동일한 결과를 얻을 수 있다. 
```bash
> git rebase --onto master old_feature new_feature
```
해당 명령은 old_feature 에 존재하는 커밋을 제외하고, new_feature 에 대해 rebase 를 수행한다. 따라서 new_feature 에서, old_feature 에 있는 B-D 커밋은 제외하고, 그 뒤의 E-H 커밋에 대해서만 rebase 가 진행된다.

단, 해당 방법은 old_feature 가 삭제 되지 않았을 경우에만 사용이 가능하다는 제약이 있다.