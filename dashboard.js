const welcomeName =
  document.querySelector('#welcome-name');

const dashboardName =
  document.querySelector('#dashboard-name');

const logoutButton =
  document.querySelector('#logout-button');

const postForm =
  document.querySelector('#post-form');

const postTitle =
  document.querySelector('#post-title');

const postCategory =
  document.querySelector('#post-category');

const postContent =
  document.querySelector('#post-content');

const postSubmit =
  document.querySelector('#post-submit');

const postMessage =
  document.querySelector('#post-message');

const myPostList =
  document.querySelector('#my-post-list');

const postCount =
  document.querySelector('#post-count');

const cancelEdit =
  document.querySelector('#cancel-edit');

const refreshPosts =
  document.querySelector('#refresh-posts');

const formTitle =
  document.querySelector('#form-title');

const formEyebrow =
  document.querySelector('#form-eyebrow');

let editingPostId = null;

async function api(
  url,
  options = {}
) {

  const response =
    await fetch(url, {
      ...options,

      headers: {
        'Content-Type':
          'application/json',

        ...(options.headers || {})
      }
    });

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      'Request failed.'
    );
  }

  return data;
}

async function loadUser() {

  try {

    const data =
      await api('/api/auth/me');

    welcomeName.textContent =
      data.user.name;

    dashboardName.textContent =
      data.user.name.split(' ')[0];

    await loadPosts();

  } catch (error) {

    window.location.href =
      '/#auth';
  }
}

async function loadPosts() {

  try {

    const data =
      await api('/api/posts/mine');

    postCount.textContent =
      data.posts.length;

    if (!data.posts.length) {

      myPostList.innerHTML =
        '<div class="empty-card">You have no posts yet. Publish your first story.</div>';

      return;
    }

    myPostList.innerHTML =
      data.posts
        .map(
          (post) => `
          <article class="dashboard-post-card">

            <div class="post-card-head">

              <div>

                <span class="category-pill">
                  ${escapeHtml(
                    post.category
                  )}
                </span>

                <h3>
                  ${escapeHtml(
                    post.title
                  )}
                </h3>

              </div>

              <div class="post-actions">

                <button
                  class="small-button"
                  data-action="edit"
                  data-id="${post._id}"
                >
                  Edit
                </button>

                <button
                  class="small-button danger"
                  data-action="delete"
                  data-id="${post._id}"
                >
                  Delete
                </button>

              </div>

            </div>

            <p>
              ${escapeHtml(
                post.content.slice(0, 240)
              )}
              ${
                post.content.length > 240
                  ? '…'
                  : ''
              }
            </p>

            <footer>
              Published
              ${formatDate(post.createdAt)}
            </footer>

          </article>
        `
        )
        .join('');

  } catch (error) {

    myPostList.innerHTML =
      `<div class="empty-card error-text">${escapeHtml(
        error.message
      )}</div>`;
  }
}

postForm.addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();

    clearMessage();

    postMessage.textContent =
      'Saving…';

    const payload = {
      title: postTitle.value,
      category: postCategory.value,
      content: postContent.value
    };

    try {

      if (editingPostId) {

        await api(
          `/api/posts/${editingPostId}`,
          {
            method: 'PUT',
            body: JSON.stringify(
              payload
            )
          }
        );

        showMessage(
          'Post updated successfully.',
          'success'
        );

      } else {

        await api('/api/posts', {
          method: 'POST',
          body: JSON.stringify(
            payload
          )
        });

        showMessage(
          'Post published successfully.',
          'success'
        );
      }

      resetEditor();

      await loadPosts();

    } catch (error) {

      showMessage(
        error.message,
        'error'
      );
    }
  }
);

myPostList.addEventListener(
  'click',
  async (event) => {

    const button =
      event.target.closest(
        'button[data-action]'
      );

    if (!button) return;

    const post =
      await findPost(
        button.dataset.id
      );

    if (!post) return;

    if (
      button.dataset.action ===
      'edit'
    ) {
      startEdit(post);
    }

    if (
      button.dataset.action ===
      'delete'
    ) {

      const shouldDelete =
        window.confirm(
          `Delete “${post.title}”? This cannot be undone.`
        );

      if (!shouldDelete) return;

      try {

        await api(
          `/api/posts/${post._id}`,
          {
            method: 'DELETE'
          }
        );

        showMessage(
          'Post deleted.',
          'success'
        );

        await loadPosts();

      } catch (error) {

        showMessage(
          error.message,
          'error'
        );
      }
    }
  }
);

async function findPost(id) {

  try {

    const data =
      await api('/api/posts/mine');

    return data.posts.find(
      (post) =>
        post._id === id
    );

  } catch (error) {

    showMessage(
      error.message,
      'error'
    );

    return null;
  }
}

function startEdit(post) {

  editingPostId = post._id;

  formEyebrow.textContent =
    'EDITING STORY';

  formTitle.textContent =
    'Update your post';

  postSubmit.textContent =
    'Save changes';

  cancelEdit.classList.remove(
    'hidden'
  );

  postTitle.value =
    post.title;

  postCategory.value =
    post.category;

  postContent.value =
    post.content;

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

cancelEdit.addEventListener(
  'click',
  resetEditor
);

refreshPosts.addEventListener(
  'click',
  loadPosts
);

logoutButton.addEventListener(
  'click',
  async () => {

    try {

      await api(
        '/api/auth/logout',
        {
          method: 'POST'
        }
      );

    } finally {

      window.location.href = '/';
    }
  }
);

function resetEditor() {

  editingPostId = null;

  formEyebrow.textContent =
    'NEW STORY';

  formTitle.textContent =
    'Create a post';

  postSubmit.textContent =
    'Publish post';

  cancelEdit.classList.add(
    'hidden'
  );

  postForm.reset();
}

function showMessage(
  message,
  type = ''
) {

  postMessage.className =
    `form-message ${type}`;

  postMessage.textContent =
    message;
}

function clearMessage() {

  postMessage.className =
    'form-message';

  postMessage.textContent = '';
}

function formatDate(value) {

  return new Date(value)
    .toLocaleDateString(
      undefined,
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
}

function escapeHtml(value) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
}

loadUser();