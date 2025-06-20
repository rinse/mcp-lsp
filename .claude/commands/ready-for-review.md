Think about your PR is getting some reviews. Think step by step;
1. Create a subtask that polls the github comments (See below).
    - It polls only once a minute.
    - It finishes if it finds new comments.
    - If the task timed out, you create the subtask again.
2. If the task finishes, you read review comments and solve them.
    - 
    - Don't forget to make sure it passes tests by running `npm test` and lint by running `npm run lint:fix`.
3. Push. Back to the step 1 to wait for review.

To efficiently view only unresolved PR comments, use this command:

```bash
gh api graphql -f query='
{
  repository(owner: "rinse", name: "git-profile-rs") {
    pullRequest(number: PR_NUMBER) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          path
          line
          comments(first: 1) {
            nodes {
              body
              author {
                login
              }
            }
          }
        }
      }
    }
  }
}' | jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```
