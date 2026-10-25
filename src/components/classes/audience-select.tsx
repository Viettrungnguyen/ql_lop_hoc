export function AudienceSelect({ groups }: { groups: { id: string; name: string }[] }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">Đối tượng</span>
      <select className="field" name="groupId">
        <option value="">Cả lớp</option>
        {groups.map((group) => <option value={group.id} key={group.id}>Nhóm: {group.name}</option>)}
      </select>
    </label>
  );
}
