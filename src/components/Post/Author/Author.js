// @flow strict
import React from 'react';
import { getContactHref } from '../../../utils';
import styles from './Author.module.scss';
import { useSiteMetadata } from '../../../hooks';

/* 하단 서명 레거시 
<a
className={styles['author__bio-twitter']}
href={getContactHref('twitter', author.contacts.twitter)}
rel="noopener noreferrer"
target="_blank"
>
<strong>{author.name}</strong> on Twitter
</a>
*/
const Author = () => {
  const { author } = useSiteMetadata();

  return (
    <div className={styles['author']}>
      <p className={styles['author__bio']}>
        {author.bio}
      </p>
    </div>
  );
};

export default Author;
