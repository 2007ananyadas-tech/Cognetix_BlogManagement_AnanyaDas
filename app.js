const tabs = document.querySelectorAll('.tab');

const nameField =
  document.querySelector('#name-field');

const authForm =
  document.querySelector('#auth-form');

const authSubmit =
  document.querySelector('#auth-submit');

const authMessage =
  document.querySelector('#auth-message');

let mode = 'login';

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {

    mode = tab.dataset.mode;

    tabs.forEach((item) => {
      item.classList.toggle(
        'active',
        item === tab
      );
    });

    nameField.classList.toggle(
      'hidden',
      mode !== 'register'
    );

    authSubmit.textContent =
      mode === 'register'
        ? 'Create account'
        : 'Log in';

    authMessage.textContent = '';

    authForm.reset();
  });
});

authForm.addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();

    authMessage.className =
      'form-message';

    authMessage.textContent =
      'Please wait…';

    const formData =
      new FormData(authForm);

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {

      const response = await fetch(
        `/api/auth/${mode}`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Request failed.'
        );
      }

      window.location.href =
        '/dashboard.html';

    } catch (error) {

      authMessage.className =
        'form-message error';

      authMessage.textContent =
        error.message;
    }
  }
);

async function loadRecentPosts() {

  const box =
    document.querySelector(
      '#recent-post-list'
    );

  try {

    const response =
      await fetch('/api/posts');

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
        'Could not load posts.'
      );
    }

    if (!data.posts.length) {

      box.innerHTML =
        '<div class="empty-card">No posts yet. Be the first writer.</div>';

      return;
    }

    box.innerHTML =
      data.posts
        .slice(0, 6)
        .map(
          (post) => `
          <article class="public-post-card">

            <span class="category-pill">
              ${escapeHtml(post.category)}
            </span>

            <h3>
              ${escapeHtml(post.title)}
            </h3>

            <p>
              ${escapeHtml(
                post.content.slice(0, 150)
              )}
              ${
                post.content.length > 150
                  ? '…'
                  : ''
              }
            </p>

            <footer>
              By
              ${escapeHtml(
                post.author?.name ||
                'Writer'
              )}
              ·
              ${formatDate(post.createdAt)}
            </footer>

          </article>
        `
        )
        .join('');

  } catch (error) {

    box.innerHTML =
      `<div class="empty-card error-text">${escapeHtml(
        error.message
      )}</div>`;
  }
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

loadRecentPosts();