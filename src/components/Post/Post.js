// @flow strict
import React from 'react';
import { Link } from 'gatsby';
import Author from './Author';
import Content from './Content';
import Utterance from './Utterance';
import Meta from './Meta';
import Tags from './Tags';
import styles from './Post.module.scss';
import {useRef, useEffect} from 'react';
import type { Node } from '../../types';
import AdSense from './AdSense/AdSenseBottom';

type Props = {
  post: Node
};

const Post = ({ post }: Props) => {
  const { html } = post;
  const { tagSlugs, slug } = post.fields;
  const { tags, title, date } = post.frontmatter;
  const commentBox = React.createRef()

  useEffect(() => {
    const scriptEl = document.createElement('script')
    scriptEl.async = true
    scriptEl.src = 'https://utteranc.es/client.js'
    scriptEl.setAttribute('repo', 'vagabond95/blog-comments')
    scriptEl.setAttribute('issue-term', 'pathname')
    scriptEl.setAttribute('id', 'utterances')
    scriptEl.setAttribute('theme', 'github-light')
    scriptEl.setAttribute('crossorigin', 'anonymous')
    if (commentBox && commentBox.current) {
      commentBox.current.appendChild(scriptEl)
    } else {
      console.log(`Error adding utterances comments on: ${commentBox}`)
    }
  }, []);

  return (
    <div className={styles['post']}>
      <Link className={styles['post__home-button']} to="/">All Articles</Link>

      <div className={styles['post__content']}>
        <Content body={html} title={title} />
      </div>

      <div className={styles['post__footer']}>
        <Meta date={date} />
        {tags && tagSlugs && <Tags tags={tags} tagSlugs={tagSlugs} />}
        <Author />
      </div>

      <AdSense />
      
      <div className={styles['comment']}>
        <Utterance commentBox={commentBox} />
      </div>
      
    </div>
  );
};

export default Post;
