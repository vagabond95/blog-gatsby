import {useRef, useEffect} from 'react'
import React from 'react';
import { useStaticQuery, graphql } from 'gatsby'

const Comment = ({commentBox}) => (<div ref={commentBox} className="comments"></div>)

function Example() {

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
    <div>
    </div>
  );
}


export default Comment